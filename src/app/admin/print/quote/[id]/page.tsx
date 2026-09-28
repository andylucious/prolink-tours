import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { date, lines, money, toNum } from "@/lib/format";
import { quoteTotals } from "@/lib/totals";
import { ItemsTable, PrintShell, TotalsBlock } from "../../PrintShell";

export default async function PrintQuote({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  const [q, s] = await Promise.all([
    db.quote.findUnique({
      where: { id },
      include: { customer: true, items: { orderBy: { sort: "asc" } }, tour: { include: { days: { orderBy: { dayNumber: "asc" } } } } },
    }),
    getSettings(),
  ]);
  if (!q) notFound();
  const t = quoteTotals(q.items, q.discount);

  return (
    <PrintShell s={s} docType="Quotation" number={q.number} closeHref={`/admin/quotes/${q.id}`}>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs uppercase text-stone-500">Prepared for</p>
          <p className="font-semibold">{q.customer.name}</p>
          {q.customer.company && <p>{q.customer.company}</p>}
          <p>{q.customer.email}</p>
          <p>{q.customer.phone}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-stone-500">Date:</span> {date(q.createdAt)}
          </p>
          <p>
            <span className="text-stone-500">Valid until:</span> {date(q.validUntil)}
          </p>
          <p>
            <span className="text-stone-500">Travel:</span> {date(q.startDate)} – {date(q.endDate)}
          </p>
          <p>
            <span className="text-stone-500">Travellers:</span> {q.adults} adults{q.children ? `, ${q.children} children` : ""}
          </p>
        </div>
      </div>
      <h1 className="mt-8 font-display text-2xl">{q.title}</h1>

      <ItemsTable rows={q.items.map((i) => ({ description: i.description, quantity: toNum(i.quantity), unitPrice: toNum(i.unitPrice) }))} currency={q.currency} />
      <TotalsBlock
        rows={[
          ["Subtotal", money(t.subtotal, q.currency)],
          ...(toNum(q.discount) ? ([["Discount", `− ${money(q.discount, q.currency)}`]] as [string, string][]) : []),
          ["Total", money(t.total, q.currency), true],
        ]}
      />

      {q.tour && q.tour.days.length > 0 && (
        <div className="mt-8 break-inside-avoid">
          <h2 className="font-display text-lg text-brand-800">Itinerary outline</h2>
          <ol className="mt-2 space-y-1">
            {q.tour.days.map((d) => (
              <li key={d.id}>
                <strong>Day {d.dayNumber}:</strong> {d.title}
                {d.accommodation && <span className="text-stone-500"> — {d.accommodation}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
      {q.tour && (
        <div className="mt-6 grid grid-cols-2 gap-6 break-inside-avoid">
          <div>
            <p className="font-semibold text-brand-800">Included</p>
            <ul className="mt-1 list-disc pl-5">
              {lines(q.tour.inclusions).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-red-800">Not included</p>
            <ul className="mt-1 list-disc pl-5">
              {lines(q.tour.exclusions).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {q.notes && <p className="mt-6 whitespace-pre-line rounded bg-stone-50 p-3">{q.notes}</p>}
      <div className="mt-6 grid grid-cols-2 gap-6 border-t pt-4 text-xs text-stone-600">
        <p className="whitespace-pre-line">
          <strong>Terms:</strong> {s.invoiceTerms}
        </p>
        <p className="whitespace-pre-line">
          <strong>Payment:</strong>
          {"\n"}
          {s.bankDetails}
          {"\n"}
          {s.mpesaDetails}
        </p>
      </div>
    </PrintShell>
  );
}
