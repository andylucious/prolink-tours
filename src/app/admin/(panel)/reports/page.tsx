import Link from "next/link";
import { getReportData } from "@/lib/reports";
import { CURRENCIES, label, money } from "@/lib/format";
import { Card, PageHeader, Stat } from "@/components/admin/ui";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ currency?: string; year?: string }> }) {
  const sp = await searchParams;
  const currency = sp.currency ?? "USD";
  const year = Number(sp.year ?? new Date().getFullYear());
  const r = await getReportData(year, currency);
  const years = [year - 1, year, year + 1];

  return (
    <>
      <PageHeader title="Reports" subtitle="Business performance — cash, sales, margins and the sales pipeline." />

      {/* Report-picker bar, styled like a desktop report viewer's filter row. */}
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 bg-sand-50 p-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Report</span>
          <select disabled className="input w-56 bg-white text-stone-700">
            <option>Full business report</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Year</span>
          <select name="year" defaultValue={year} className="input w-28">
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Currency</span>
          <select name="currency" defaultValue={currency} className="input w-24">
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button className="btn-primary">View</button>
        <Link href="/admin" className="btn-outline">
          Close
        </Link>
        <span className="flex-1" />
        {/* A separate, standalone document — opens on its own with no admin chrome to hide,
            so it always prints/downloads cleanly regardless of where it's opened from. */}
        <a href={`/admin/print/report?year=${year}&currency=${currency}`} target="_blank" rel="noopener noreferrer" className="btn-outline">
          🖨 Print / PDF
        </a>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Cash received" value={money(r.received, currency)} />
        <Stat label="Paid to suppliers" value={money(r.supplierPaid, currency)} />
        <Stat label="Trip sales (by travel date)" value={money(r.sales, currency)} hint={`${r.bookingsCount} bookings`} />
        <Stat label="Gross margin" value={money(r.sales - r.cost, currency)} hint={r.sales ? `${Math.round(((r.sales - r.cost) / r.sales) * 100)}% of sales` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Cash received by month">
          <div className="flex h-56 items-end gap-2">
            {r.months.map((x) => (
              <div key={x.m} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-brand-500"
                  style={{ height: `${(x.total / r.maxMonth) * 100}%`, minHeight: x.total ? 4 : 0 }}
                  title={money(x.total, currency)}
                />
                <span className="text-[10px] text-stone-500">{new Date(Date.UTC(2000, x.m, 1)).toLocaleString("en", { month: "short", timeZone: "UTC" })}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title={`Receivables ageing (${currency})`}>
          <div className="space-y-3">
            {Object.entries(r.buckets).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span>{k}</span>
                <span className={`font-semibold ${k !== "Current" && v > 0 ? "text-red-700" : ""}`}>{money(v, currency)}</span>
              </div>
            ))}
            <Link href="/admin/invoices" className="block pt-2 text-sm text-brand-700 hover:underline">
              View invoices →
            </Link>
          </div>
        </Card>

        <Card title="Sales & margin by tour" className="xl:col-span-2">
          {r.tourRows.length ? (
            <div className="-m-5 overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th className="text-right">Bookings</th>
                    <th className="text-right">Travellers</th>
                    <th className="text-right">Sales</th>
                    <th className="text-right">Supplier cost</th>
                    <th className="text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {r.tourRows.map(([k, e]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td className="text-right">{e.count}</td>
                      <td className="text-right">{e.pax}</td>
                      <td className="text-right">{money(e.value, currency)}</td>
                      <td className="text-right">{money(e.cost, currency)}</td>
                      <td className="text-right font-semibold">
                        {money(e.value - e.cost, currency)} <span className="text-xs font-normal text-stone-500">{e.value ? Math.round(((e.value - e.cost) / e.value) * 100) : 0}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-stone-500">No bookings in {currency} for {year}.</p>
          )}
        </Card>

        <Card title={`Inquiry pipeline ${year}`}>
          <div className="space-y-2">
            {r.funnel.map(([s, n]) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <span className="w-24">{label(s)}</span>
                <div className="h-3 flex-1 rounded bg-stone-100">
                  <div className="h-3 rounded bg-accent-400" style={{ width: `${r.inquiriesCount ? (n / r.inquiriesCount) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right font-semibold">{n}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-stone-600">
            {r.inquiriesCount} inquiries · win rate {r.closed ? Math.round((r.won / r.closed) * 100) : 0}% of closed leads
          </p>
        </Card>

        <Card title="Where inquiries come from">
          <div className="space-y-2">
            {r.sources.map(([s, n]) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <span className="w-24">{label(s)}</span>
                <div className="h-3 flex-1 rounded bg-stone-100">
                  <div className="h-3 rounded bg-brand-500" style={{ width: `${(n / Math.max(1, r.inquiriesCount)) * 100}%` }} />
                </div>
                <span className="w-8 text-right font-semibold">{n}</span>
              </div>
            ))}
            {!r.sources.length && <p className="text-sm text-stone-500">No inquiries yet this year.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
