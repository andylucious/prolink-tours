import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { date, label, lines, money, toNum } from "@/lib/format";
import { quoteTotals } from "@/lib/totals";
import { ItemsTable, PrintShell, TotalsBlock } from "@/app/admin/print/PrintShell";

/**
 * A booking's printable/downloadable A4 document — a quotation-style summary before travel, or
 * a confirmation once CONFIRMED. Shared by the staff route (/admin/print/booking/[id]) and the
 * customer's own route (/account/bookings/[id]/print); each does its own auth before rendering
 * this, so there's no access check in here.
 */
export async function BookingDocument({ id, closeHref = `/admin/bookings/${id}` }: { id: number; closeHref?: string }) {
  const [b, s] = await Promise.all([
    db.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        tour: { include: { days: { orderBy: { dayNumber: "asc" } } } },
        quote: { include: { items: { orderBy: { sort: "asc" } } } },
        invoices: { include: { payments: true } },
      },
    }),
    getSettings(),
  ]);
  if (!b) notFound();

  // Prefer the priced line items from the linked quote; fall back to one line at the booking total.
  const items = b.quote?.items.length
    ? b.quote.items.map((i) => ({ description: i.description, quantity: toNum(i.quantity), unitPrice: toNum(i.unitPrice) }))
    : [{ description: b.title, quantity: 1, unitPrice: toNum(b.total) }];
  const discount = b.quote ? toNum(b.quote.discount) : 0;
  const total = b.quote ? quoteTotals(b.quote.items, b.quote.discount).total : toNum(b.total);
  const paid = b.invoices.reduce((sum, inv) => sum + inv.payments.reduce((s2, p) => s2 + toNum(p.amount), 0), 0);

  const docType = b.status === "CONFIRMED" || b.status === "IN_PROGRESS" || b.status === "COMPLETED" ? "Booking Confirmation" : "Booking / Quotation";

  return (
    <PrintShell s={s} docType={docType} number={b.ref} closeHref={closeHref}>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs uppercase text-stone-500">Prepared for</p>
          <p className="font-semibold">{b.customer.name}</p>
          {b.customer.company && <p>{b.customer.company}</p>}
          <p>{b.customer.email}</p>
          <p>{b.customer.phone}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-stone-500">Status:</span> {label(b.status)}
          </p>
          <p>
            <span className="text-stone-500">Booked:</span> {date(b.createdAt)}
          </p>
          <p>
            <span className="text-stone-500">Travel:</span> {date(b.startDate)} – {date(b.endDate)}
          </p>
          <p>
            <span className="text-stone-500">Travellers:</span> {b.adults} adults{b.children ? `, ${b.children} children` : ""}
          </p>
        </div>
      </div>
      <h1 className="mt-8 font-display text-2xl">{b.title}</h1>

      <ItemsTable rows={items} currency={b.currency} />
      <TotalsBlock
        rows={[
          ...(discount ? ([["Discount", `− ${money(discount, b.currency)}`]] as [string, string][]) : []),
          ["Total", money(total, b.currency), true],
          ...(paid ? ([["Paid to date", money(paid, b.currency)], ["Balance", money(total - paid, b.currency), true]] as [string, string, boolean?][]) : []),
        ]}
      />

      {b.tour && b.tour.days.length > 0 && (
        <div className="mt-8 break-inside-avoid">
          <h2 className="font-display text-lg text-brand-800">Itinerary</h2>
          <ol className="mt-2 space-y-1">
            {b.tour.days.map((d) => (
              <li key={d.id}>
                <strong>Day {d.dayNumber}:</strong> {d.title}
                {d.accommodation && <span className="text-stone-500"> — {d.accommodation}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
      {b.tour && (
        <div className="mt-6 grid grid-cols-2 gap-6 break-inside-avoid">
          <div>
            <p className="font-semibold text-brand-800">Included</p>
            <ul className="mt-1 list-disc pl-5">
              {lines(b.tour.inclusions).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-red-800">Not included</p>
            <ul className="mt-1 list-disc pl-5">
              {lines(b.tour.exclusions).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {b.notes && <p className="mt-6 whitespace-pre-line rounded bg-stone-50 p-3">{b.notes}</p>}
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

/** The booking's customerId, so a route can check ownership before rendering. */
export async function bookingOwner(id: number) {
  return db.booking.findUnique({ where: { id }, select: { customerId: true } });
}
