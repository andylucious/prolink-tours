import Link from "next/link";
import type { BookingStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { date, money } from "@/lib/format";
import { Badge, EnumSelect, Empty, PageHeader, SearchBar } from "@/components/admin/ui";

export const metadata = { title: "Bookings" };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; when?: string }> }) {
  const { q, status, when = "upcoming" } = await searchParams;
  const today = new Date(new Date().toISOString().slice(0, 10));
  const where: Prisma.BookingWhereInput = {
    ...(status ? { status: status as BookingStatus } : {}),
    ...(when === "upcoming" ? { endDate: { gte: today } } : when === "past" ? { endDate: { lt: today } } : {}),
    ...(q ? { OR: [{ ref: { contains: q } }, { title: { contains: q } }, { customer: { name: { contains: q } } }] } : {}),
  };
  const bookings = await db.booking.findMany({
    where,
    include: { customer: true, services: { select: { status: true } } },
    orderBy: { startDate: when === "past" ? "desc" : "asc" },
    take: 300,
  });

  const tab = (w: string, l: string) => (
    <Link href={`/admin/bookings?when=${w}`} className={`rounded-full px-3 py-1 text-sm ${when === w ? "bg-brand-700 text-white" : "bg-white ring-1 ring-stone-200"}`}>
      {l}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Confirmed trips, their suppliers and vouchers."
        actions={
          <Link href="/admin/bookings/new" className="btn-primary">
            + New booking
          </Link>
        }
      />
      <div className="mb-4 flex gap-2">
        {tab("upcoming", "Upcoming & ongoing")}
        {tab("past", "Past")}
        {tab("all", "All")}
      </div>
      <SearchBar q={q} placeholder="Ref, trip or customer…">
        <input type="hidden" name="when" value={when} />
        <EnumSelect name="status" values={["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]} defaultValue={status} allowEmpty="All statuses" className="input w-44" />
      </SearchBar>
      {bookings.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Booking</th>
                <th>Pax</th>
                <th>Suppliers</th>
                <th className="text-right">Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const pending = b.services.filter((s) => s.status === "REQUESTED").length;
                return (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap">
                      {date(b.startDate)}
                      <p className="text-xs text-stone-500">to {date(b.endDate)}</p>
                    </td>
                    <td>
                      <Link href={`/admin/bookings/${b.id}`} className="font-medium text-brand-700 hover:underline">
                        {b.title}
                      </Link>
                      <p className="text-xs text-stone-500">
                        {b.ref} · {b.customer.name}
                      </p>
                    </td>
                    <td>{b.adults + b.children}</td>
                    <td className="text-xs">
                      {b.services.length === 0 ? (
                        <span className="text-stone-400">None</span>
                      ) : pending ? (
                        <span className="font-semibold text-amber-700">{pending} to confirm</span>
                      ) : (
                        <span className="text-emerald-700">{b.services.length} confirmed</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-right">{money(b.total, b.currency)}</td>
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
        <Empty>No bookings found.</Empty>
      )}
    </>
  );
}
