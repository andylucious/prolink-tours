import "server-only";
import { db } from "./db";
import { receivables } from "./finance";
import { toNum } from "./format";

/** All figures behind the Reports page, shared by the interactive view and the printable version. */
export async function getReportData(year: number, currency: string) {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  const [payments, bookings, inquiries, rec, supplierPaid, newClients, recentSignIns] = await Promise.all([
    db.payment.findMany({ where: { date: { gte: from, lt: to }, invoice: { currency } }, select: { date: true, amount: true } }),
    db.booking.findMany({
      where: { startDate: { gte: from, lt: to }, currency, status: { not: "CANCELLED" } },
      include: { tour: { select: { title: true } }, services: { where: { status: { not: "CANCELLED" } }, select: { cost: true } } },
    }),
    db.inquiry.findMany({ where: { createdAt: { gte: from, lt: to } }, select: { status: true, source: true, createdAt: true, email: true } }),
    receivables(),
    db.supplierPayment.aggregate({ where: { date: { gte: from, lt: to }, currency }, _sum: { amount: true } }),
    // Clients added this year. A client "has an account" once they've signed in themselves
    // (password or Google) — records staff typed in by hand never have a last-login time.
    db.customer.findMany({ where: { createdAt: { gte: from, lt: to } }, select: { createdAt: true, lastLoginAt: true } }),
    db.customer.findMany({
      where: { lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: "desc" },
      take: 8,
      select: { name: true, email: true, createdAt: true, lastLoginAt: true, _count: { select: { bookings: true } } },
    }),
  ]);

  // Cash received per month
  const months = Array.from({ length: 12 }, (_, m) => ({ m, total: 0 }));
  for (const p of payments) months[p.date.getUTCMonth()].total += toNum(p.amount);
  const maxMonth = Math.max(1, ...months.map((x) => x.total));
  const received = months.reduce((s, x) => s + x.total, 0);

  // Sales & margin by tour
  const byTour = new Map<string, { count: number; pax: number; value: number; cost: number }>();
  for (const b of bookings) {
    const k = b.tour?.title ?? "Custom trips";
    const e = byTour.get(k) ?? { count: 0, pax: 0, value: 0, cost: 0 };
    e.count++;
    e.pax += b.adults + b.children;
    e.value += toNum(b.total);
    e.cost += b.services.reduce((s, x) => s + toNum(x.cost), 0);
    byTour.set(k, e);
  }
  const tourRows = [...byTour.entries()].sort((a, b) => b[1].value - a[1].value);
  const sales = tourRows.reduce((s, [, e]) => s + e.value, 0);
  const cost = tourRows.reduce((s, [, e]) => s + e.cost, 0);

  // New client inquiries and new client accounts, month by month
  const inquiriesByMonth = Array.from({ length: 12 }, (_, m) => ({ m, total: 0 }));
  for (const i of inquiries) inquiriesByMonth[i.createdAt.getUTCMonth()].total++;
  const clientsByMonth = Array.from({ length: 12 }, (_, m) => ({ m, clients: 0, accounts: 0 }));
  for (const c of newClients) {
    const row = clientsByMonth[c.createdAt.getUTCMonth()];
    row.clients++;
    if (c.lastLoginAt) row.accounts++;
  }
  const newClientsCount = newClients.length;
  const newAccountsCount = newClients.filter((c) => c.lastLoginAt).length;
  const uniqueInquirers = new Set(inquiries.map((i) => i.email.toLowerCase())).size;

  // Inquiry funnel
  const funnel = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"].map((s) => [s, inquiries.filter((i) => i.status === s).length] as const);
  const won = inquiries.filter((i) => i.status === "WON").length;
  const closed = won + inquiries.filter((i) => i.status === "LOST").length;
  const sources = [...new Set(inquiries.map((i) => i.source))].map((s) => [s, inquiries.filter((i) => i.source === s).length] as const).sort((a, b) => b[1] - a[1]);

  // Receivables ageing (by due date)
  const now = Date.now();
  const buckets = { Current: 0, "1–30 days": 0, "31–60 days": 0, "60+ days": 0 };
  for (const i of rec.invoices) {
    if (i.status === "DRAFT" || i.currency !== currency) continue;
    const days = Math.floor((now - i.dueDate.getTime()) / 86400000);
    const k = days <= 0 ? "Current" : days <= 30 ? "1–30 days" : days <= 60 ? "31–60 days" : "60+ days";
    buckets[k] += i.totals.balance;
  }

  return {
    year,
    currency,
    months,
    maxMonth,
    received,
    tourRows,
    sales,
    cost,
    bookingsCount: bookings.length,
    funnel,
    won,
    closed,
    sources,
    inquiriesCount: inquiries.length,
    buckets,
    supplierPaid: toNum(supplierPaid._sum.amount),
    inquiriesByMonth,
    clientsByMonth,
    newClientsCount,
    newAccountsCount,
    uniqueInquirers,
    recentSignIns,
  };
}

export type ReportData = Awaited<ReturnType<typeof getReportData>>;
