import Link from "next/link";
import { db } from "@/lib/db";
import { addTo, fmtMulti, type ByCurrency } from "@/lib/finance";
import { date, label, money, toNum } from "@/lib/format";
import { Empty, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Payments received" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { from, to } = await searchParams;
  const payments = await db.payment.findMany({
    where: { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } },
    include: { invoice: { include: { customer: true } } },
    orderBy: { date: "desc" },
    take: 500,
  });
  const total: ByCurrency = {};
  for (const p of payments) addTo(total, p.invoice.currency, toNum(p.amount));

  return (
    <>
      <PageHeader title="Payments received" subtitle={<>Total in range: <strong>{fmtMulti(total)}</strong></>} />
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="label">From</span>
          <input type="date" name="from" defaultValue={from} className="input" />
        </label>
        <label className="text-sm">
          <span className="label">To</span>
          <input type="date" name="to" defaultValue={to} className="input" />
        </label>
        <button className="btn-outline">Filter</button>
      </form>
      {payments.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Method</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap">{date(p.date)}</td>
                  <td>{p.invoice.customer.name}</td>
                  <td>
                    <Link href={`/admin/invoices/${p.invoiceId}`} className="text-brand-700 hover:underline">
                      {p.invoice.number}
                    </Link>
                  </td>
                  <td>{label(p.method)}</td>
                  <td className="text-stone-600">{p.reference ?? "—"}</td>
                  <td className="whitespace-nowrap text-right font-medium">{money(p.amount, p.invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No payments in this range. Payments are recorded on each invoice.</Empty>
      )}
    </>
  );
}
