import Link from "next/link";
import type { InvoiceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { date, money } from "@/lib/format";
import { invoiceTotals } from "@/lib/totals";
import { Badge, EnumSelect, Empty, PageHeader, SearchBar } from "@/components/admin/ui";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const invoices = await db.invoice.findMany({
    where: {
      ...(status ? { status: status as InvoiceStatus } : {}),
      ...(q ? { OR: [{ number: { contains: q } }, { customer: { name: { contains: q } } }, { booking: { ref: { contains: q } } }] } : {}),
    },
    include: { customer: true, items: true, payments: true, booking: { select: { ref: true } } },
    orderBy: { issueDate: "desc" },
    take: 300,
  });
  const now = new Date();
  return (
    <>
      <PageHeader
        title="Invoices"
        actions={
          <Link href="/admin/invoices/new" className="btn-primary">
            + New invoice
          </Link>
        }
      />
      <SearchBar q={q} placeholder="Number, customer or booking ref…">
        <EnumSelect name="status" values={["DRAFT", "SENT", "PARTIAL", "PAID", "VOID"]} defaultValue={status} allowEmpty="All statuses" className="input w-40" />
      </SearchBar>
      {invoices.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Customer</th>
                <th>Issued</th>
                <th>Due</th>
                <th className="text-right">Total</th>
                <th className="text-right">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => {
                const t = invoiceTotals(i);
                const overdue = ["SENT", "PARTIAL"].includes(i.status) && i.dueDate < now;
                return (
                  <tr key={i.id}>
                    <td>
                      <Link href={`/admin/invoices/${i.id}`} className="font-medium text-brand-700 hover:underline">
                        {i.number}
                      </Link>
                      {i.booking && <p className="text-xs text-stone-500">{i.booking.ref}</p>}
                    </td>
                    <td>{i.customer.name}</td>
                    <td className="whitespace-nowrap">{date(i.issueDate)}</td>
                    <td className={`whitespace-nowrap ${overdue ? "font-semibold text-red-700" : ""}`}>{date(i.dueDate)}</td>
                    <td className="whitespace-nowrap text-right">{money(t.total, i.currency)}</td>
                    <td className="whitespace-nowrap text-right font-medium">{money(t.balance, i.currency)}</td>
                    <td>
                      <Badge value={overdue ? "OVERDUE" : i.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No invoices found.</Empty>
      )}
    </>
  );
}
