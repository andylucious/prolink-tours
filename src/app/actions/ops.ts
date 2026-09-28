"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BookingStatus, ServiceStatus, SupplierType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { bool, dateOrNull, dec, int, opt, optInt, str } from "@/lib/form";
import { docNumber } from "@/lib/numbering";

// ───────── Bookings ─────────

function bookingData(fd: FormData) {
  return {
    customerId: int(fd, "customerId"),
    tourId: optInt(fd, "tourId"),
    title: str(fd, "title"),
    startDate: dateOrNull(fd, "startDate") ?? new Date(),
    endDate: dateOrNull(fd, "endDate") ?? dateOrNull(fd, "startDate") ?? new Date(),
    adults: int(fd, "adults", 2),
    children: int(fd, "children", 0),
    currency: str(fd, "currency") || "USD",
    total: dec(fd, "total"),
    status: (str(fd, "status") || "CONFIRMED") as BookingStatus,
    notes: opt(fd, "notes"),
  };
}

export async function createBooking(fd: FormData) {
  await requireUser();
  const b = await db.booking.create({ data: { ...bookingData(fd), ref: docNumber("BK") } });
  redirect(`/admin/bookings/${b.id}`);
}

export async function updateBooking(id: number, fd: FormData) {
  await requireUser();
  await db.booking.update({ where: { id }, data: bookingData(fd) });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function deleteBooking(id: number) {
  await requireUser();
  await db.booking.delete({ where: { id } });
  redirect("/admin/bookings");
}

export async function addService(bookingId: number, fd: FormData) {
  await requireUser();
  const b = await db.booking.findUniqueOrThrow({ where: { id: bookingId }, select: { currency: true } });
  await db.bookingService.create({
    data: {
      bookingId,
      supplierId: optInt(fd, "supplierId"),
      description: str(fd, "description"),
      serviceDate: dateOrNull(fd, "serviceDate"),
      quantity: dec(fd, "quantity", 1),
      cost: dec(fd, "cost"),
      currency: str(fd, "currency") || b.currency,
      notes: opt(fd, "notes"),
      voucherNo: docNumber("VCH"),
    },
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function setServiceStatus(id: number, status: ServiceStatus) {
  await requireUser();
  const s = await db.bookingService.update({ where: { id }, data: { status } });
  revalidatePath(`/admin/bookings/${s.bookingId}`);
}

export async function deleteService(id: number) {
  await requireUser();
  const s = await db.bookingService.delete({ where: { id } });
  revalidatePath(`/admin/bookings/${s.bookingId}`);
}

/** Issue an invoice for a booking, copying the quote's priced lines when available. */
export async function invoiceBooking(bookingId: number, fd: FormData) {
  await requireUser();
  const b = await db.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { quote: { include: { items: true } } } });
  const pct = Math.min(100, Math.max(1, dec(fd, "percent", 100)));
  const factor = pct / 100;

  let items: { description: string; quantity: number; unitPrice: number; sort: number }[];
  let discount = 0;
  if (b.quote?.items.length && pct === 100) {
    items = b.quote.items.map((i, sort) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), sort }));
    discount = Number(b.quote.discount);
  } else {
    items = [{ description: `${b.title}${pct < 100 ? ` — ${pct}% deposit` : ""} (${b.ref})`, quantity: 1, unitPrice: Math.round(Number(b.total) * factor * 100) / 100, sort: 0 }];
  }

  const due = new Date(Math.min(b.startDate.getTime() - 30 * 86400000, Date.now() + 14 * 86400000));
  const inv = await db.invoice.create({
    data: {
      number: docNumber("INV"),
      customerId: b.customerId,
      bookingId: b.id,
      issueDate: new Date(),
      dueDate: due < new Date() ? new Date(Date.now() + 7 * 86400000) : due,
      currency: b.currency,
      discount,
      items: { create: items },
    },
  });
  redirect(`/admin/invoices/${inv.id}`);
}

// ───────── Suppliers ─────────

function supplierData(fd: FormData) {
  return {
    name: str(fd, "name"),
    type: str(fd, "type") as SupplierType,
    contactName: opt(fd, "contactName"),
    email: opt(fd, "email"),
    phone: opt(fd, "phone"),
    location: opt(fd, "location"),
    paymentInfo: opt(fd, "paymentInfo"),
    notes: opt(fd, "notes"),
    active: bool(fd, "active"),
  };
}

export async function createSupplier(fd: FormData) {
  await requireUser();
  const s = await db.supplier.create({ data: supplierData(fd) });
  redirect(`/admin/suppliers/${s.id}`);
}

export async function updateSupplier(id: number, fd: FormData) {
  await requireUser();
  await db.supplier.update({ where: { id }, data: supplierData(fd) });
  revalidatePath(`/admin/suppliers/${id}`);
}
