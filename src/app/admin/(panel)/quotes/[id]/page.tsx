import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { acceptQuote, deleteQuote, duplicateQuote, setQuoteStatus, updateQuote } from "@/app/actions/sales";
import { date, money } from "@/lib/format";
import { quoteTotals } from "@/lib/totals";
import { Badge, PageHeader, Stat } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import { QuoteForm } from "../QuoteForm";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const quote = await db.quote.findUnique({ where: { id }, include: { items: { orderBy: { sort: "asc" } }, customer: true, booking: true, inquiry: true } });
  if (!quote) notFound();
  const t = quoteTotals(quote.items, quote.discount);
  const locked = quote.status === "ACCEPTED";

  return (
    <>
      <PageHeader
        title={`${quote.number}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/customers/${quote.customerId}`} className="text-brand-700 hover:underline">
              {quote.customer.name}
            </Link>
            · created {date(quote.createdAt)} <Badge value={quote.status} />
            {quote.inquiry && (
              <Link href={`/admin/inquiries/${quote.inquiry.id}`} className="text-xs text-stone-500 underline">
                from {quote.inquiry.ref}
              </Link>
            )}
          </span>
        }
        back={{ href: "/admin/quotes", label: "Quotes" }}
        actions={
          <>
            <a href={`/admin/print/quote/${quote.id}`} target="_blank" className="btn-outline">
              Print / PDF
            </a>
            {quote.status === "DRAFT" && (
              <form action={setQuoteStatus.bind(null, quote.id, "SENT")}>
                <SubmitButton className="btn-outline">Mark as sent</SubmitButton>
              </form>
            )}
            {!locked && quote.status !== "DECLINED" && (
              <form action={setQuoteStatus.bind(null, quote.id, "DECLINED")}>
                <SubmitButton className="btn-outline">Declined</SubmitButton>
              </form>
            )}
            <form action={duplicateQuote.bind(null, quote.id)}>
              <SubmitButton className="btn-outline">Duplicate</SubmitButton>
            </form>
            {quote.booking ? (
              <Link href={`/admin/bookings/${quote.booking.id}`} className="btn-primary">
                View booking {quote.booking.ref} →
              </Link>
            ) : (
              <form action={acceptQuote.bind(null, quote.id)}>
                <SubmitButton className="btn-accent">✓ Accept & create booking</SubmitButton>
              </form>
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Client total" value={money(t.total, quote.currency)} />
        <Stat label="Supplier cost" value={money(t.cost, quote.currency)} />
        <Stat label="Gross margin" value={<span className={t.margin >= 0 ? "text-emerald-700" : "text-red-700"}>{money(t.margin, quote.currency)}</span>} />
        <Stat label="Margin %" value={t.total ? `${Math.round((t.margin / t.total) * 100)}%` : "—"} hint={`Valid until ${date(quote.validUntil)}`} />
      </div>

      {locked && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">This quote was accepted. Edits here won&apos;t change the booking that was created from it.</p>}
      <QuoteForm action={updateQuote.bind(null, quote.id)} quote={quote} submitLabel="Save quote" />

      <form action={deleteQuote.bind(null, quote.id)} className="mt-8">
        <ConfirmButton message="Delete this quote?">Delete quote</ConfirmButton>
      </form>
    </>
  );
}
