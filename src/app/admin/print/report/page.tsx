import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getReportData } from "@/lib/reports";
import { date, label, money } from "@/lib/format";
import { PrintShell, TotalsBlock } from "../PrintShell";

export default async function PrintReport({ searchParams }: { searchParams: Promise<{ year?: string; currency?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const currency = sp.currency ?? "USD";
  const year = Number(sp.year ?? new Date().getFullYear());
  const [s, r] = await Promise.all([getSettings(), getReportData(year, currency)]);

  return (
    <PrintShell s={s} docType="Business Report" number={`${year} · ${currency}`} closeHref="/admin/reports">
      <p className="mt-4 text-xs text-stone-500">Printed {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>

      <TotalsBlock
        rows={[
          ["Cash received", money(r.received, currency)],
          ["Paid to suppliers", money(r.supplierPaid, currency)],
          ["Trip sales (by travel date)", money(r.sales, currency)],
          ["Gross margin", money(r.sales - r.cost, currency), true],
        ]}
      />

      <h2 className="mt-8 font-display text-lg text-brand-800">Cash received by month</h2>
      <table className="mt-2 w-full text-xs">
        <tbody>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            {r.months.map((x) => (
              <th key={x.m} className="py-1 font-normal">
                {new Date(Date.UTC(2000, x.m, 1)).toLocaleString("en", { month: "short", timeZone: "UTC" })}
              </th>
            ))}
          </tr>
          <tr>
            {r.months.map((x) => (
              <td key={x.m} className="py-1">
                {money(x.total, currency)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <h2 className="mt-8 font-display text-lg text-brand-800">Sales &amp; margin by tour</h2>
      {r.tourRows.length ? (
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="border-b border-stone-300 text-left uppercase text-stone-500">
              <th className="py-2">Tour</th>
              <th className="py-2 text-right">Bookings</th>
              <th className="py-2 text-right">Travellers</th>
              <th className="py-2 text-right">Sales</th>
              <th className="py-2 text-right">Supplier cost</th>
              <th className="py-2 text-right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {r.tourRows.map(([k, e]) => (
              <tr key={k} className="border-b border-stone-100">
                <td className="py-2 pr-2">{k}</td>
                <td className="py-2 text-right">{e.count}</td>
                <td className="py-2 text-right">{e.pax}</td>
                <td className="py-2 text-right">{money(e.value, currency)}</td>
                <td className="py-2 text-right">{money(e.cost, currency)}</td>
                <td className="py-2 text-right font-semibold">{money(e.value - e.cost, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-2 text-sm text-stone-500">
          No bookings in {currency} for {year}.
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-8 break-inside-avoid">
        <div>
          <h2 className="font-display text-lg text-brand-800">Receivables ageing</h2>
          <table className="mt-2 w-full text-xs">
            <tbody>
              {Object.entries(r.buckets).map(([k, v]) => (
                <tr key={k} className="border-b border-stone-100">
                  <td className="py-1.5">{k}</td>
                  <td className="py-1.5 text-right font-semibold">{money(v, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="font-display text-lg text-brand-800">Inquiry pipeline {year}</h2>
          <table className="mt-2 w-full text-xs">
            <tbody>
              {r.funnel.map(([st, n]) => (
                <tr key={st} className="border-b border-stone-100">
                  <td className="py-1.5">{label(st)}</td>
                  <td className="py-1.5 text-right font-semibold">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-stone-500">
            {r.inquiriesCount} inquiries · win rate {r.closed ? Math.round((r.won / r.closed) * 100) : 0}% of closed leads
          </p>
        </div>
      </div>

      {r.sources.length > 0 && (
        <div className="mt-6 break-inside-avoid">
          <h2 className="font-display text-lg text-brand-800">Where inquiries come from</h2>
          <table className="mt-2 w-full text-xs">
            <tbody>
              {r.sources.map(([src, n]) => (
                <tr key={src} className="border-b border-stone-100">
                  <td className="py-1.5">{label(src)}</td>
                  <td className="py-1.5 text-right font-semibold">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2 className="mt-8 font-display text-lg text-brand-800">New clients &amp; accounts</h2>
      <table className="mt-2 w-full text-xs">
        <tbody>
          <tr className="border-b border-stone-100">
            <td className="py-1.5">New inquiries</td>
            <td className="py-1.5 text-right font-semibold">
              {r.inquiriesCount} <span className="font-normal text-stone-500">from {r.uniqueInquirers} different people</span>
            </td>
          </tr>
          <tr className="border-b border-stone-100">
            <td className="py-1.5">New clients added</td>
            <td className="py-1.5 text-right font-semibold">{r.newClientsCount}</td>
          </tr>
          <tr className="border-b border-stone-100">
            <td className="py-1.5">Clients who created an account</td>
            <td className="py-1.5 text-right font-semibold">{r.newAccountsCount}</td>
          </tr>
        </tbody>
      </table>
      <table className="mt-3 w-full text-xs">
        <tbody>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-1 font-normal" />
            {r.months.map((x) => (
              <th key={x.m} className="py-1 font-normal">
                {new Date(Date.UTC(2000, x.m, 1)).toLocaleString("en", { month: "short", timeZone: "UTC" })}
              </th>
            ))}
          </tr>
          <tr>
            <td className="py-1 pr-2 text-stone-500">Inquiries</td>
            {r.inquiriesByMonth.map((x) => (
              <td key={x.m} className="py-1">
                {x.total}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-1 pr-2 text-stone-500">New clients</td>
            {r.clientsByMonth.map((x) => (
              <td key={x.m} className="py-1">
                {x.clients}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-1 pr-2 text-stone-500">With account</td>
            {r.clientsByMonth.map((x) => (
              <td key={x.m} className="py-1">
                {x.accounts}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {r.recentSignIns.length > 0 && (
        <div className="mt-4 break-inside-avoid">
          <p className="text-xs font-semibold text-stone-600">Latest client sign-ins</p>
          <table className="mt-1 w-full text-xs">
            <tbody>
              {r.recentSignIns.map((c) => (
                <tr key={c.email ?? c.name} className="border-b border-stone-100">
                  <td className="py-1.5">
                    {c.name} <span className="text-stone-500">{c.email}</span>
                  </td>
                  <td className="py-1.5 text-right text-stone-500">joined {date(c.createdAt)}</td>
                  <td className="py-1.5 text-right">last in {date(c.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PrintShell>
  );
}
