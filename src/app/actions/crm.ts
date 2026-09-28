"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InquiryStatus, LeadSource, Residency } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateOrNull, int, opt, optInt, str } from "@/lib/form";
import { docNumber } from "@/lib/numbering";
import { getPricingData } from "@/lib/catalog";
import { CHILD_FACTOR, estimate, pickRate, seasonFor } from "@/lib/pricing";

const residencyOf = (fd: FormData): Residency => (str(fd, "residency") === "RESIDENT" ? "RESIDENT" : "NON_RESIDENT");

// ───────── Inquiries ─────────

export async function createInquiry(fd: FormData) {
  await requireUser();
  const inq = await db.inquiry.create({
    data: {
      ref: docNumber("INQ"),
      name: str(fd, "name"),
      email: str(fd, "email"),
      phone: opt(fd, "phone"),
      country: opt(fd, "country"),
      residency: residencyOf(fd),
      tourId: optInt(fd, "tourId"),
      adults: int(fd, "adults", 2),
      children: int(fd, "children", 0),
      startDate: dateOrNull(fd, "startDate"),
      endDate: dateOrNull(fd, "endDate"),
      message: opt(fd, "message"),
      source: (str(fd, "source") || "PHONE") as LeadSource,
    },
  });
  redirect(`/admin/inquiries/${inq.id}`);
}

export async function updateInquiry(id: number, fd: FormData) {
  await requireUser();
  await db.inquiry.update({
    where: { id },
    data: {
      status: str(fd, "status") as InquiryStatus,
      source: str(fd, "source") as LeadSource,
      assignedToId: optInt(fd, "assignedToId"),
      notes: opt(fd, "notes"),
    },
  });
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function deleteInquiry(id: number) {
  await requireUser();
  await db.inquiry.delete({ where: { id } });
  redirect("/admin/inquiries");
}

/** Creates (or reuses) the customer and a draft quote pre-filled from the inquiry's estimate. */
export async function convertInquiryToQuote(id: number) {
  await requireUser();
  const inq = await db.inquiry.findUniqueOrThrow({ where: { id }, include: { addOns: true, tour: true } });

  let customerId = inq.customerId;
  if (!customerId) {
    const existing = inq.email ? await db.customer.findFirst({ where: { email: inq.email } }) : null;
    customerId =
      existing?.id ??
      (
        await db.customer.create({
          data: { name: inq.name, email: inq.email, phone: inq.phone, country: inq.country, residency: inq.residency },
        })
      ).id;
  }

  const items: { description: string; quantity: number; unitPrice: number; unitCost: number; sort: number }[] = [];
  let currency = inq.currency;
  if (inq.tour) {
    const pricing = await getPricingData();
    const t = pricing.tours.find((x) => x.id === inq.tourId);
    if (t) {
      const pax = inq.adults + inq.children;
      const season = seasonFor(inq.startDate?.toISOString(), pricing.seasons);
      const rate = pickRate(t.rates, season, inq.residency, pax);
      const selected = pricing.addOns.filter((a) => inq.addOns.some((x) => x.addOnId === a.id));
      const est = estimate({
        rates: t.rates,
        seasons: pricing.seasons,
        addOns: selected,
        startDate: inq.startDate?.toISOString(),
        residency: inq.residency,
        adults: inq.adults,
        children: inq.children,
        days: t.durationDays,
        usdToKes: pricing.usdToKes,
      });
      currency = est.currency;
      if (rate) {
        items.push({ description: `${t.title} — adult (${season.toLowerCase()} season)`, quantity: inq.adults, unitPrice: rate.pricePerPerson, unitCost: 0, sort: 0 });
        if (inq.children)
          items.push({ description: `${t.title} — child under 12`, quantity: inq.children, unitPrice: rate.pricePerPerson * CHILD_FACTOR, unitCost: 0, sort: 1 });
      }
      // Add-on lines use the amounts the estimator calculated (already currency-converted).
      const addOnLines = est.lines.slice(est.lines.length - selected.length);
      addOnLines.forEach((l, i) =>
        items.push({
          description: l.detail ? `${l.label} (${l.detail})` : l.label,
          quantity: 1,
          unitPrice: Math.round(l.amount * 100) / 100,
          unitCost: 0,
          sort: 10 + i,
        }),
      );
    }
  }

  const quote = await db.quote.create({
    data: {
      number: docNumber("QT"),
      customerId,
      inquiryId: inq.id,
      tourId: inq.tourId,
      title: inq.tour?.title ?? `Custom trip for ${inq.name}`,
      startDate: inq.startDate,
      endDate: inq.endDate,
      adults: inq.adults,
      children: inq.children,
      currency,
      validUntil: new Date(Date.now() + 14 * 86400000),
      items: { create: items },
    },
  });
  await db.inquiry.update({ where: { id }, data: { status: "QUOTED", customerId } });
  redirect(`/admin/quotes/${quote.id}`);
}

// ───────── Customers ─────────

function customerData(fd: FormData) {
  return {
    name: str(fd, "name"),
    email: opt(fd, "email"),
    phone: opt(fd, "phone"),
    country: opt(fd, "country"),
    company: opt(fd, "company"),
    residency: residencyOf(fd),
    notes: opt(fd, "notes"),
  };
}

export async function createCustomer(fd: FormData) {
  await requireUser();
  const c = await db.customer.create({ data: customerData(fd) });
  redirect(`/admin/customers/${c.id}`);
}

export async function updateCustomer(id: number, fd: FormData) {
  await requireUser();
  await db.customer.update({ where: { id }, data: customerData(fd) });
  revalidatePath(`/admin/customers/${id}`);
}

export async function deleteCustomer(id: number) {
  await requireUser();
  const refs = await db.customer.findUniqueOrThrow({ where: { id }, select: { _count: { select: { quotes: true, bookings: true, invoices: true } } } });
  if (refs._count.quotes + refs._count.bookings + refs._count.invoices > 0) {
    redirect(`/admin/customers/${id}?error=in-use`);
  }
  await db.customer.delete({ where: { id } });
  redirect("/admin/customers");
}
