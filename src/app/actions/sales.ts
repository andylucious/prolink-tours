"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { QuoteStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateOrNull, dec, int, items, opt, optInt, str } from "@/lib/form";
import { docNumber } from "@/lib/numbering";
import { quoteTotals } from "@/lib/totals";
import type { LineItem } from "@/components/admin/client";

function quoteHeader(fd: FormData) {
  return {
    customerId: int(fd, "customerId"),
    tourId: optInt(fd, "tourId"),
    title: str(fd, "title"),
    startDate: dateOrNull(fd, "startDate"),
    endDate: dateOrNull(fd, "endDate"),
    adults: int(fd, "adults", 2),
    children: int(fd, "children", 0),
    currency: str(fd, "currency") || "USD",
    validUntil: dateOrNull(fd, "validUntil"),
    discount: dec(fd, "discount"),
    notes: opt(fd, "notes"),
  };
}

const quoteItems = (fd: FormData) =>
  items<LineItem>(fd).map((i, sort) => ({
    description: i.description,
    supplierId: i.supplierId || null,
    serviceDate: i.serviceDate ? new Date(i.serviceDate) : null,
    quantity: Number(i.quantity) || 0,
    unitCost: Number(i.unitCost) || 0,
    unitPrice: Number(i.unitPrice) || 0,
    sort,
  }));

export async function createQuote(fd: FormData) {
  await requireUser();
  const q = await db.quote.create({
    data: { ...quoteHeader(fd), number: docNumber("QT"), items: { create: quoteItems(fd) } },
  });
  redirect(`/admin/quotes/${q.id}`);
}

export async function updateQuote(id: number, fd: FormData) {
  await requireUser();
  await db.$transaction([
    db.quoteItem.deleteMany({ where: { quoteId: id } }),
    db.quote.update({ where: { id }, data: { ...quoteHeader(fd), items: { create: quoteItems(fd) } } }),
  ]);
  revalidatePath(`/admin/quotes/${id}`);
  redirect(`/admin/quotes/${id}`);
}

export async function setQuoteStatus(id: number, status: QuoteStatus) {
  await requireUser();
  await db.quote.update({ where: { id }, data: { status } });
  revalidatePath(`/admin/quotes/${id}`);
}

export async function deleteQuote(id: number) {
  await requireUser();
  await db.quote.delete({ where: { id } });
  redirect("/admin/quotes");
}

/** Client accepted: create a booking with one supplier service per costed line. */
export async function acceptQuote(id: number) {
  await requireUser();
  const q = await db.quote.findUniqueOrThrow({ where: { id }, include: { items: true, booking: true, tour: true } });
  if (q.booking) redirect(`/admin/bookings/${q.booking.id}`);

  const { total } = quoteTotals(q.items, q.discount);
  const start = q.startDate ?? new Date();
  const end = q.endDate ?? new Date(start.getTime() + ((q.tour?.durationDays ?? 1) - 1) * 86400000);

  const booking = await db.booking.create({
    data: {
      ref: docNumber("BK"),
      customerId: q.customerId,
      quoteId: q.id,
      tourId: q.tourId,
      title: q.title,
      startDate: start,
      endDate: end,
      adults: q.adults,
      children: q.children,
      currency: q.currency,
      total,
      status: "CONFIRMED",
      services: {
        create: q.items
          .filter((i) => i.supplierId || Number(i.unitCost) > 0)
          .map((i) => ({
            supplierId: i.supplierId,
            description: i.description,
            serviceDate: i.serviceDate ?? start,
            quantity: i.quantity,
            cost: Number(i.quantity) * Number(i.unitCost),
            currency: q.currency,
            voucherNo: docNumber("VCH"),
          })),
      },
    },
  });
  await db.quote.update({ where: { id }, data: { status: "ACCEPTED" } });
  if (q.inquiryId) await db.inquiry.update({ where: { id: q.inquiryId }, data: { status: "WON" } });
  redirect(`/admin/bookings/${booking.id}`);
}

export async function duplicateQuote(id: number) {
  await requireUser();
  const q = await db.quote.findUniqueOrThrow({ where: { id }, include: { items: true } });
  const { id: _i, number: _n, createdAt: _c, updatedAt: _u, items: its, ...rest } = q;
  const copy = await db.quote.create({
    data: {
      ...rest,
      status: "DRAFT",
      number: docNumber("QT"),
      title: `${q.title} (copy)`,
      items: { create: its.map(({ id: _x, quoteId: _q, ...i }) => i) },
    },
  });
  redirect(`/admin/quotes/${copy.id}`);
}
