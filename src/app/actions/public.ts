"use server";

import { db } from "@/lib/db";
import { getPricingData } from "@/lib/catalog";
import { estimate, type Residency } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";
import { docNumber } from "@/lib/numbering";
import { dateOrNull, int, opt, str } from "@/lib/form";
import { money } from "@/lib/format";

export type FormState = { ok?: boolean; error?: string; ref?: string } | null;

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function submitInquiry(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "website")) return { ok: true, ref: "—" }; // honeypot: bots fill hidden field

  const name = str(fd, "name");
  const email = str(fd, "email");
  if (!name || !emailOk(email)) return { error: "Please enter your name and a valid email address." };

  const residency = (str(fd, "residency") === "RESIDENT" ? "RESIDENT" : "NON_RESIDENT") as Residency;
  const adults = Math.max(1, int(fd, "adults", 1));
  const children = Math.max(0, int(fd, "children", 0));
  const startDate = dateOrNull(fd, "startDate");
  const addOnIds = fd.getAll("addOns").map((v) => Number(v)).filter(Boolean);

  // Recalculate the estimate on the server so it can't be tampered with.
  const pricing = await getPricingData();
  const tour = pricing.tours.find((t) => t.id === int(fd, "tourId"));
  let est: ReturnType<typeof estimate> | null = null;
  if (tour) {
    est = estimate({
      rates: tour.rates,
      seasons: pricing.seasons,
      addOns: pricing.addOns.filter((a) => addOnIds.includes(a.id)),
      startDate: startDate?.toISOString(),
      residency,
      adults,
      children,
      days: tour.durationDays,
      usdToKes: pricing.usdToKes,
    });
  }
  let endDate = dateOrNull(fd, "endDate");
  if (!endDate && startDate && tour) endDate = new Date(startDate.getTime() + (tour.durationDays - 1) * 86400000);

  const inquiry = await db.inquiry.create({
    data: {
      ref: docNumber("INQ"),
      tourId: tour?.id ?? null,
      name,
      email,
      phone: opt(fd, "phone"),
      country: opt(fd, "country"),
      residency,
      adults,
      children,
      startDate,
      endDate,
      message: opt(fd, "message"),
      estimatedTotal: est?.total ?? null,
      currency: est?.currency ?? "USD",
      source: "WEBSITE",
      addOns: { create: addOnIds.map((addOnId) => ({ addOnId })) },
    },
  });

  const s = await getSettings();
  const alertTo = s.notifyEmail || s.email;
  await sendMail(
    alertTo,
    `New inquiry ${inquiry.ref}: ${tour?.title ?? "Custom trip"}`,
    [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${inquiry.phone ?? "-"}`,
      `Trip: ${tour?.title ?? "Custom trip"}`,
      `Dates: ${startDate?.toDateString() ?? "flexible"}`,
      `Travellers: ${adults} adults, ${children} children (${residency})`,
      est ? `Estimate: ${money(est.total, est.currency)} (${est.season} season)` : "",
      "",
      inquiry.message ?? "",
    ].join("\n"),
  );
  await sendMail(
    email,
    `We received your inquiry — ${s.companyName}`,
    `Hi ${name},\n\nThank you for your interest${tour ? ` in the ${tour.title}` : ""}. Your reference is ${inquiry.ref}. Our team will send you a tailored quote within 24 hours.\n\n${s.companyName}\n${s.phone}`,
  );

  return { ok: true, ref: inquiry.ref };
}

export async function submitContact(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "website")) return { ok: true };
  const name = str(fd, "name");
  const email = str(fd, "email");
  const message = str(fd, "message");
  if (!name || !emailOk(email) || !message) return { error: "Please fill in your name, a valid email and a message." };
  await db.contactMessage.create({ data: { name, email, phone: opt(fd, "phone"), subject: opt(fd, "subject"), message } });
  const s = await getSettings();
  await sendMail(s.notifyEmail || s.email, `Website message from ${name}`, `${name} <${email}>\n\n${message}`);
  return { ok: true };
}
