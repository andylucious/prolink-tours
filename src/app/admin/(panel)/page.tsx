import Link from "next/link";
import { db } from "@/lib/db";
import { addTo, fmtMulti, payables, receivables, type ByCurrency } from "@/lib/finance";
import { date, money, toNum } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, Stat } from "@/components/admin/ui";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const in30 = new Date(today.getTime() + 30 * 86400000);

  const [newInquiries, monthInquiries, wonThisMonth, upcoming, recentInquiries, monthPayments, rec, pay, openQuotes] = await Promise.all([
    db.inquiry.count({ where: { status: "NEW" } }),
    db.inquiry.count({ where: { createdAt: { gte: monthStart } } }),
    db.inquiry.count({ where: { createdAt: { gte: monthStart }, status: "WON" } }),
    db.booking.findMany({
      where: { startDate: { gte: today, lte: in30 }, status: { in: ["CONFIRMED", "PENDING"] } },
      include: { customer: true, services: { select: { status: true } } },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
    db.inquiry.findMany({ include: { tour: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.payment.findMany({ where: { date: { gte: monthStart } }, include: { invoice: { select: { currency: true } } } }),
    receivables(),
    payables(),
    db.quote.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
  ]);

  const collected: ByCurrency = {};
  for (const p of monthPayments) addTo(collected, p.invoice.currency, toNum(p.amount));
  const overdueInvoices = rec.invoices.filter((i) => i.overdue);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={
          <>
            <Link href="/admin/inquiries/new" className="btn-outline">
              + Log inquiry
            </Link>
            <Link href="/admin/quotes/new" className="btn-primary">
              + New quote
            </Link>
          </>
        }
      />
      {denied && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">That page is only available to administrators.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="New inquiries" value={newInquiries} hint={`${monthInquiries} this month · ${wonThisMonth} won`} href="/admin/inquiries?status=NEW" />
        <Stat label="Open quotes" value={openQuotes} hint="Draft or sent" href="/admin/quotes" />
        <Stat label="Collected this month" value={<span className="text-xl">{fmtMulti(collected)}</span>} href="/admin/payments" />
        <Stat
          label="Owed to us"
          value={<span className="text-xl">{fmtMulti(rec.total)}</span>}
          hint={Object.keys(rec.overdue).length ? <span className="text-red-600">Overdue: {fmtMulti(rec.overdue)}</span> : "Nothing overdue"}
          href="/admin/invoices"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card
          title="Departures — next 30 days"
          className="xl:col-span-2"
          actions={
            <Link href="/admin/bookings" className="text-sm text-brand-700 hover:underline">
              All bookings
            </Link>
          }
        >
          {upcoming.length ? (
            <div className="-m-5 overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Booking</th>
                    <th>Pax</th>
                    <th>Suppliers</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((b) => {
                    const pending = b.services.filter((s) => s.status === "REQUESTED").length;
                    return (
                      <tr key={b.id}>
                        <td className="whitespace-nowrap">{date(b.startDate)}</td>
                        <td>
                          <Link href={`/admin/bookings/${b.id}`} className="font-medium text-brand-700 hover:underline">
                            {b.title}
                          </Link>
                          <p className="text-xs text-stone-500">
                            {b.customer.name} · {b.ref}
                          </p>
                        </td>
                        <td>{b.adults + b.children}</td>
                        <td>{pending ? <span className="text-xs font-semibold text-amber-700">{pending} unconfirmed</span> : <span className="text-xs text-emerald-700">All confirmed</span>}</td>
                        <td>
                          <Badge value={b.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No departures in the next 30 days.</Empty>
          )}
        </Card>

        <Card
          title="Latest inquiries"
          actions={
            <Link href="/admin/inquiries" className="text-sm text-brand-700 hover:underline">
              View all
            </Link>
          }
        >
          <ul className="-my-2 divide-y divide-stone-100">
            {recentInquiries.map((i) => (
              <li key={i.id} className="py-2.5">
                <Link href={`/admin/inquiries/${i.id}`} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium">{i.name}</span>
                    <span className="block text-xs text-stone-500">{i.tour?.title ?? "Custom trip"}</span>
                  </span>
                  <Badge value={i.status} />
                </Link>
              </li>
            ))}
            {!recentInquiries.length && <li className="py-4 text-sm text-stone-500">No inquiries yet.</li>}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Overdue invoices">
          {overdueInvoices.length ? (
            <ul className="-my-2 divide-y divide-stone-100 text-sm">
              {overdueInvoices.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2.5">
                  <Link href={`/admin/invoices/${i.id}`} className="text-brand-700 hover:underline">
                    {i.number} · {i.customer.name}
                  </Link>
                  <span className="font-semibold text-red-700">
                    {money(i.totals.balance, i.currency)} <span className="text-xs font-normal text-stone-500">due {date(i.dueDate)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">No overdue invoices. 🎉</p>
          )}
        </Card>
        <Card
          title="We owe suppliers"
          actions={
            <Link href="/admin/suppliers" className="text-sm text-brand-700 hover:underline">
              Suppliers
            </Link>
          }
        >
          <p className="text-2xl font-bold">{fmtMulti(pay.total)}</p>
          <p className="mt-1 text-sm text-stone-500">Booked supplier services not yet paid (excluding cancelled).</p>
        </Card>
      </div>
    </>
  );
}
