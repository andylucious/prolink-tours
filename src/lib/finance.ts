import "server-only";
import { db } from "./db";
import { invoiceTotals } from "./totals";
import { money, toNum } from "./format";

export type ByCurrency = Record<string, number>;

export const addTo = (acc: ByCurrency, cur: string, n: number) => ((acc[cur] = (acc[cur] ?? 0) + n), acc);

export const fmtMulti = (m: ByCurrency) => {
  const entries = Object.entries(m).filter(([, v]) => Math.abs(v) > 0.009);
  return entries.length ? entries.map(([c, v]) => money(v, c)).join(" · ") : "—";
};

export async function openInvoices() {
  const invoices = await db.invoice.findMany({
    where: { status: { in: ["SENT", "PARTIAL", "DRAFT"] } },
    include: { items: true, payments: true, customer: true },
    orderBy: { dueDate: "asc" },
  });
  return invoices.map((i) => ({ ...i, totals: invoiceTotals(i), overdue: i.status !== "DRAFT" && i.dueDate < new Date() }));
}

export async function receivables() {
  const inv = await openInvoices();
  const total: ByCurrency = {};
  const overdue: ByCurrency = {};
  for (const i of inv) {
    if (i.status === "DRAFT") continue;
    addTo(total, i.currency, i.totals.balance);
    if (i.overdue) addTo(overdue, i.currency, i.totals.balance);
  }
  return { total, overdue, invoices: inv };
}

/** Supplier cost booked on non-cancelled services minus what's been paid, per supplier. */
export async function payables() {
  const [services, payments] = await Promise.all([
    db.bookingService.findMany({
      where: { status: { not: "CANCELLED" }, supplierId: { not: null }, booking: { status: { not: "CANCELLED" } } },
      select: { supplierId: true, cost: true, currency: true },
    }),
    db.supplierPayment.findMany({ select: { supplierId: true, amount: true, currency: true } }),
  ]);
  const perSupplier = new Map<number, ByCurrency>();
  const total: ByCurrency = {};
  for (const s of services) {
    const m = perSupplier.get(s.supplierId!) ?? {};
    addTo(m, s.currency, toNum(s.cost));
    perSupplier.set(s.supplierId!, m);
    addTo(total, s.currency, toNum(s.cost));
  }
  for (const p of payments) {
    const m = perSupplier.get(p.supplierId) ?? {};
    addTo(m, p.currency, -toNum(p.amount));
    perSupplier.set(p.supplierId, m);
    addTo(total, p.currency, -toNum(p.amount));
  }
  return { total, perSupplier };
}
