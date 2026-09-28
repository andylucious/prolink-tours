import Link from "next/link";
import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { date, money } from "@/lib/format";
import { invoiceTotals, quoteTotals } from "@/lib/totals";
import { logoutCustomer } from "@/app/actions/customer-auth";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-amber-50 text-amber-700",
  QUOTED: "bg-violet-50 text-violet-700",
  WON: "bg-emerald-50 text-emerald-700",
  LOST: "bg-stone-100 text-stone-600",
  DRAFT: "bg-stone-100 text-stone-600",
  SENT: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  DECLINED: "bg-red-50 text-red-700",
  EXPIRED: "bg-stone-100 text-stone-500",
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-stone-100 text-stone-700",
  CANCELLED: "bg-red-50 text-red-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  VOID: "bg-stone-100 text-stone-500",
};
const Badge = ({ v }: { v: string }) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[v] ?? "bg-stone-100 text-stone-700"}`}>{v.replace("_", " ")}</span>;

export default async function AccountPage() {
  const session = await requireCustomer();
  const customer = await db.customer.findUniqueOrThrow({
    where: { id: session.cid },
    include: {
      bookings: { include: { tour: true }, orderBy: { createdAt: "desc" } },
      quotes: { include: { items: true }, orderBy: { createdAt: "desc" } },
      inquiries: { include: { tour: true }, orderBy: { createdAt: "desc" } },
      invoices: { include: { items: true, payments: true }, orderBy: { issueDate: "desc" } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">My account</p>
          <h1 className="mt-1 font-display text-3xl">Hi, {customer.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-stone-600">{customer.email}</p>
        </div>
        <form action={logoutCustomer}>
          <button className="btn-outline">Sign out</button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl">Your bookings</h2>
        {customer.bookings.length ? (
          <div className="mt-4 space-y-3">
            {customer.bookings.map((b) => (
              <Link key={b.id} href={`/account/bookings/${b.id}`} className="card card-hover flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-xs text-stone-500">
                    {b.ref} · {date(b.startDate)} – {date(b.endDate)} · {b.adults + b.children} travellers
                    {b.selfBooked && <span className="ml-1 text-accent-600">· booked online</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{money(b.total, b.currency)}</span>
                  <Badge v={b.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">
            No bookings yet.{" "}
            <Link href="/tours" className="font-semibold text-brand-700 underline">
              Browse tours
            </Link>{" "}
            to book your first trip.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Quotes</h2>
        {customer.quotes.length ? (
          <div className="mt-4 space-y-3">
            {customer.quotes.map((q) => {
              const t = quoteTotals(q.items, q.discount);
              return (
                <div key={q.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{q.title}</p>
                    <p className="text-xs text-stone-500">
                      {q.number} · sent {date(q.createdAt)} · valid until {date(q.validUntil)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{money(t.total, q.currency)}</span>
                    <Badge v={q.status} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No quotes yet.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Inquiries</h2>
        {customer.inquiries.length ? (
          <div className="mt-4 space-y-3">
            {customer.inquiries.map((i) => (
              <div key={i.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{i.tour?.title ?? "Custom trip"}</p>
                  <p className="text-xs text-stone-500">
                    {i.ref} · sent {date(i.createdAt)}
                  </p>
                </div>
                <Badge v={i.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No inquiries yet.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Invoices</h2>
        {customer.invoices.length ? (
          <div className="mt-4 space-y-3">
            {customer.invoices.map((inv) => {
              const t = invoiceTotals(inv);
              return (
                <div key={inv.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{inv.number}</p>
                    <p className="text-xs text-stone-500">
                      Issued {date(inv.issueDate)} · due {date(inv.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {money(t.total, inv.currency)} <span className="text-xs font-normal text-stone-500">bal {money(t.balance, inv.currency)}</span>
                    </span>
                    <Badge v={inv.status} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No invoices yet.</p>
        )}
      </section>
    </div>
  );
}
