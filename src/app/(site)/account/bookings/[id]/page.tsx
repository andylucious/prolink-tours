import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { date, label, lines, money } from "@/lib/format";
import { invoiceTotals } from "@/lib/totals";

export const metadata: Metadata = { title: "Booking" };
export const dynamic = "force-dynamic";

export default async function AccountBookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const session = await requireCustomer();
  const { id } = await params;
  const { new: justCreated } = await searchParams;
  const booking = await db.booking.findUnique({
    where: { id: Number(id) },
    include: { tour: true, invoices: { include: { items: true, payments: true } } },
  });
  if (!booking || booking.customerId !== session.cid) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/account" className="text-sm font-semibold text-brand-700 hover:underline">
          ← My account
        </Link>
        <a href={`/account/bookings/${booking.id}/print`} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">
          🖨 Download / print
        </a>
      </div>

      {justCreated && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          🎉 Booking request received! Our team will confirm availability and reach out shortly.
        </div>
      )}

      <h1 className="mt-4 font-display text-3xl">{booking.title}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {booking.ref} · {date(booking.startDate)} – {date(booking.endDate)}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="label">Status</p>
          <p className="mt-1 font-semibold">{label(booking.status)}</p>
        </div>
        <div className="card p-4">
          <p className="label">Travellers</p>
          <p className="mt-1 font-semibold">
            {booking.adults} adults{booking.children ? `, ${booking.children} children` : ""}
          </p>
        </div>
        <div className="card p-4">
          <p className="label">Total</p>
          <p className="mt-1 font-semibold">{money(booking.total, booking.currency)}</p>
        </div>
      </div>

      {booking.status === "PENDING" && (
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          This booking is awaiting confirmation from our team. We&apos;ll be in touch to confirm availability before any payment is due.
        </p>
      )}

      {booking.tour && (
        <section className="mt-8">
          <h2 className="font-display text-xl">What&apos;s included</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-stone-700">
            {lines(booking.tour.inclusions).map((l) => (
              <li key={l}>✓ {l}</li>
            ))}
          </ul>
        </section>
      )}

      {booking.invoices.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl">Invoices</h2>
          <div className="mt-3 space-y-3">
            {booking.invoices.map((inv) => {
              const t = invoiceTotals(inv);
              return (
                <div key={inv.id} className="card flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{inv.number}</p>
                    <p className="text-xs text-stone-500">Due {date(inv.dueDate)}</p>
                  </div>
                  <p className="font-semibold">
                    {money(t.total, inv.currency)} <span className="text-xs font-normal text-stone-500">bal {money(t.balance, inv.currency)}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {booking.notes && (
        <section className="mt-8">
          <h2 className="font-display text-xl">Notes</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-stone-700">{booking.notes}</p>
        </section>
      )}
    </div>
  );
}
