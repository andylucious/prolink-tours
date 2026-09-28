import Link from "next/link";
import type { QuoteStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { date, money } from "@/lib/format";
import { quoteTotals } from "@/lib/totals";
import { Badge, EnumSelect, Empty, PageHeader, SearchBar } from "@/components/admin/ui";

export const metadata = { title: "Quotes" };

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const quotes = await db.quote.findMany({
    where: {
      ...(status ? { status: status as QuoteStatus } : {}),
      ...(q ? { OR: [{ number: { contains: q } }, { title: { contains: q } }, { customer: { name: { contains: q } } }] } : {}),
    },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader
        title="Quotes"
        subtitle="Build itineraries with supplier costs and margins, then send to clients."
        actions={
          <Link href="/admin/quotes/new" className="btn-primary">
            + New quote
          </Link>
        }
      />
      <SearchBar q={q} placeholder="Number, title or customer…">
        <EnumSelect name="status" values={["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"]} defaultValue={status} allowEmpty="All statuses" className="input w-40" />
      </SearchBar>
      {quotes.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Customer / trip</th>
                <th>Travel</th>
                <th className="text-right">Total</th>
                <th className="text-right">Margin</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((qt) => {
                const t = quoteTotals(qt.items, qt.discount);
                return (
                  <tr key={qt.id}>
                    <td>
                      <Link href={`/admin/quotes/${qt.id}`} className="font-medium text-brand-700 hover:underline">
                        {qt.number}
                      </Link>
                      <p className="text-xs text-stone-500">{date(qt.createdAt)}</p>
                    </td>
                    <td>
                      {qt.customer.name}
                      <p className="text-xs text-stone-500">{qt.title}</p>
                    </td>
                    <td className="whitespace-nowrap">{date(qt.startDate)}</td>
                    <td className="whitespace-nowrap text-right font-medium">{money(t.total, qt.currency)}</td>
                    <td className={`whitespace-nowrap text-right ${t.margin >= 0 ? "text-emerald-700" : "text-red-700"}`}>{money(t.margin, qt.currency)}</td>
                    <td>
                      <Badge value={qt.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No quotes yet.</Empty>
      )}
    </>
  );
}
