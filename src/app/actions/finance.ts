"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InvoiceStatus, PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateOrNull, dec, int, items, opt, optInt, str } from "@/lib/form";
import { docNumber } from "@/lib/numbering";
import { invoiceTotals } from "@/lib/totals";
import type { LineItem } from "@/components/admin/client";

const invoiceItems = (fd: FormData) =>
  items<LineItem>(fd).map((i, sort) => ({ description: i.description, quantity: Number(i.quantity) || 0, unitPrice: Number(i.unitPrice) || 0, sort }));

function invoiceHeader(fd: FormData) {
  return {
    customerId: int(fd, "customerId"),
    bookingId: optInt(fd, "bookingId"),
    issueDate: dateOrNull(fd, "issueDate") ?? new Date(),
    dueDate: dateOrNull(fd, "dueDate") ?? new Date(Date.now() + 14 * 86400000),
    currency: str(fd, "currency") || "USD",
    discount: dec(fd, "discount"),
    taxRate: dec(fd, "taxRate"),
    notes: opt(fd, "notes"),
  };
}

/** Keep invoice status in line with payments (never overrides DRAFT→SENT or VOID manually set). */
async function syncStatus(invoiceId: number) {
  const inv = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { items: true, payments: true } });
  if (inv.status === "VOID") return;
  const t = invoiceTotals(inv);
  const status: InvoiceStatus = t.paid <= 0 ? (inv.status === "DRAFT" ? "DRAFT" : "SENT") : t.balance <= 0.009 ? "PAID" : "PARTIAL";
  if (status !== inv.status) await db.invoice.update({ where: { id: invoiceId }, data: { status } });
}

export async function createInvoice(fd: FormData) {
  await requireUser();
  const inv = await db.invoice.create({ data: { ...invoiceHeader(fd), number: docNumber("INV"), items: { create: invoiceItems(fd) } } });
  redirect(`/admin/invoices/${inv.id}`);
}

export async function updateInvoice(id: number, fd: FormData) {
  await requireUser();
  await db.$transaction([
    db.invoiceItem.deleteMany({ where: { invoiceId: id } }),
    db.invoice.update({ where: { id }, data: { ...invoiceHeader(fd), items: { create: invoiceItems(fd) } } }),
  ]);
  await syncStatus(id);
  redirect(`/admin/invoices/${id}`);
}

export async function setInvoiceStatus(id: number, status: InvoiceStatus) {
  await requireUser();
  await db.invoice.update({ where: { id }, data: { status } });
  if (status !== "VOID") await syncStatus(id);
  revalidatePath(`/admin/invoices/${id}`);
}

export async function deleteInvoice(id: number) {
  await requireUser();
  await db.invoice.delete({ where: { id } });
  redirect("/admin/invoices");
}

export async function addPayment(invoiceId: number, fd: FormData) {
  await requireUser();
  const amount = dec(fd, "amount");
  if (amount <= 0) return;
  await db.payment.create({
    data: {
      invoiceId,
      amount,
      date: dateOrNull(fd, "date") ?? new Date(),
      method: str(fd, "method") as PaymentMethod,
      reference: opt(fd, "reference"),
      notes: opt(fd, "notes"),
    },
  });
  await syncStatus(invoiceId);
  revalidatePath(`/admin/invoices/${invoiceId}`);
}

export async function deletePayment(id: number) {
  await requireUser();
  const p = await db.payment.delete({ where: { id } });
  await syncStatus(p.invoiceId);
  revalidatePath(`/admin/invoices/${p.invoiceId}`);
  revalidatePath("/admin/payments");
}

// ───────── Supplier payments (payables) ─────────

export async function addSupplierPayment(fd: FormData) {
  await requireUser();
  const amount = dec(fd, "amount");
  if (amount <= 0) return;
  const supplierId = int(fd, "supplierId");
  await db.supplierPayment.create({
    data: {
      supplierId,
      serviceId: optInt(fd, "serviceId"),
      amount,
      currency: str(fd, "currency") || "USD",
      date: dateOrNull(fd, "date") ?? new Date(),
      method: str(fd, "method") as PaymentMethod,
      reference: opt(fd, "reference"),
      notes: opt(fd, "notes"),
    },
  });
  const back = str(fd, "back");
  revalidatePath(`/admin/suppliers/${supplierId}`);
  revalidatePath("/admin/supplier-payments");
  if (back.startsWith("/admin")) redirect(back);
}

export async function deleteSupplierPayment(id: number) {
  await requireUser();
  const p = await db.supplierPayment.delete({ where: { id } });
  revalidatePath(`/admin/suppliers/${p.supplierId}`);
  revalidatePath("/admin/supplier-payments");
}
