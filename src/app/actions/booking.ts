"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPricingData } from "@/lib/catalog";
import { estimate, type Residency } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";
import { docNumber } from "@/lib/numbering";
import { dateOrNull, int, opt, str } from "@/lib/form";
import { money } from "@/lib/format";
import { CUSTOMER_SESSION_COOKIE, sessionCookieOptions, signCustomerSession } from "@/lib/session";
import { getCustomerSession } from "@/lib/customer-auth";
import { CLAIM_BLOCKED, canClaimWithPassword } from "@/lib/customer-claim";

export type BookingFormState = { error?: string; ref?: string } | null;
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/**
 * Self-service "Book now": the traveller picks a tour + dates and books it directly, no staff
 * quote in between. If they're not already signed in, this also creates (or logs into) their
 * account so the trip shows up in their booking history afterwards.
 */
export async function createPublicBooking(_: BookingFormState, fd: FormData): Promise<BookingFormState> {
  if (str(fd, "website")) return { ref: "—" }; // honeypot

  const tourId = int(fd, "tourId");
  const adults = Math.max(1, int(fd, "adults", 1));
  const children = Math.max(0, int(fd, "children", 0));
  const residency = (str(fd, "residency") === "RESIDENT" ? "RESIDENT" : "NON_RESIDENT") as Residency;
  if (!tourId) return { error: "Please choose a tour." };
  const addOnIds = fd.getAll("addOns").map((v) => Number(v)).filter(Boolean);

  const pricing = await getPricingData();
  const tour = pricing.tours.find((t) => t.id === tourId);
  if (!tour) return { error: "That tour could not be found." };

  // A fixed event / road trip runs on its own date, so ignore whatever date the form sent.
  const startDate = tour.eventDate ? new Date(tour.eventDate) : dateOrNull(fd, "startDate");
  if (!startDate) return { error: "Please choose a start date." };

  // Seat limit: checked here on the server, so it can't be skipped by editing the form.
  const seats = adults + children;
  if (tour.seatsLeft != null && seats > tour.seatsLeft) {
    return { error: tour.seatsLeft === 0 ? "Sorry, this trip is fully booked." : `Only ${tour.seatsLeft} seat${tour.seatsLeft === 1 ? " is" : "s are"} left — please reduce the number of travellers.` };
  }
  const endDate = new Date(startDate.getTime() + (tour.durationDays - 1) * 86400000);

  const est = estimate({
    rates: tour.rates,
    seasons: pricing.seasons,
    addOns: pricing.addOns.filter((a) => addOnIds.includes(a.id)),
    startDate: startDate.toISOString(),
    residency,
    adults,
    children,
    days: tour.durationDays,
    usdToKes: pricing.usdToKes,
  });

  // Already signed in → book straight to their account, no password step.
  const existingSession = await getCustomerSession();
  let customerId: number;
  let customerName: string;
  let customerEmail: string;

  if (existingSession) {
    const c = await db.customer.findUniqueOrThrow({ where: { id: existingSession.cid } });
    customerId = c.id;
    customerName = c.name;
    customerEmail = c.email!;
  } else {
    const name = str(fd, "name");
    const email = str(fd, "email").toLowerCase();
    const password = str(fd, "password");
    if (!name || !emailOk(email)) return { error: "Please enter your name and a valid email address." };
    if (password.length < 6) return { error: "Choose a password of at least 6 characters so you can track this booking." };

    const existing = await db.customer.findUnique({ where: { email } });
    if (existing?.passwordHash) return { error: "An account with this email already exists. Please sign in first, then book." };
    if (existing && !(await canClaimWithPassword(existing.id))) return { error: CLAIM_BLOCKED };

    const passwordHash = await bcrypt.hash(password, 10);
    const customer = existing
      ? await db.customer.update({ where: { id: existing.id }, data: { name, passwordHash, phone: opt(fd, "phone") ?? existing.phone, lastLoginAt: new Date() } })
      : await db.customer.create({ data: { name, email, passwordHash, phone: opt(fd, "phone"), country: opt(fd, "country"), residency, lastLoginAt: new Date() } });

    const token = await signCustomerSession({ cid: customer.id, name: customer.name, email });
    (await cookies()).set(CUSTOMER_SESSION_COOKIE, token, sessionCookieOptions);
    customerId = customer.id;
    customerName = customer.name;
    customerEmail = email;
  }

  const booking = await db.booking.create({
    data: {
      ref: docNumber("BK"),
      customerId,
      tourId: tour.id,
      title: tour.title,
      startDate,
      endDate,
      adults,
      children,
      currency: est.currency,
      total: est.total,
      status: "PENDING",
      selfBooked: true,
      notes: opt(fd, "message"),
    },
  });

  const s = await getSettings();
  await sendMail(
    s.notifyEmail || s.email,
    `New online booking ${booking.ref}: ${tour.title}`,
    [
      `Customer: ${customerName} <${customerEmail}>`,
      `Trip: ${tour.title}`,
      `Dates: ${startDate.toDateString()} → ${endDate.toDateString()}`,
      `Travellers: ${adults} adults, ${children} children (${residency})`,
      `Total: ${money(est.total, est.currency)}`,
      "",
      "This booking was made directly on the website and needs confirmation.",
    ].join("\n"),
  );
  await sendMail(
    customerEmail,
    `Booking received — ${s.companyName}`,
    `Hi ${customerName},\n\nThank you for booking the ${tour.title} (ref ${booking.ref}). Our team will confirm availability and send you payment details shortly.\n\nYou can track this booking any time by signing in at ${s.companyName}'s website.\n\n${s.companyName}\n${s.phone}`,
  );

  redirect(`/account/bookings/${booking.id}?new=1`);
}
