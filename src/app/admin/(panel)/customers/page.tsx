import Link from "next/link";
import { db } from "@/lib/db";
import { createCustomer } from "@/app/actions/crm";
import { label } from "@/lib/format";
import { Card, EnumSelect, Empty, Field, PageHeader, SearchBar } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const customers = await db.customer.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }, { company: { contains: q } }] } : {},
    include: { _count: { select: { bookings: true, quotes: true } } },
    orderBy: { name: "asc" },
    take: 300,
  });
  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone you have quoted or booked." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SearchBar q={q} placeholder="Name, email, phone, company…" />
          {customers.length ? (
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Country</th>
                    <th>Residency</th>
                    <th className="text-right">Quotes / Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/admin/customers/${c.id}`} className="font-medium text-brand-700 hover:underline">
                          {c.name}
                        </Link>
                        {c.company && <p className="text-xs text-stone-500">{c.company}</p>}
                      </td>
                      <td className="text-stone-600">
                        {c.email}
                        <p className="text-xs">{c.phone}</p>
                      </td>
                      <td>{c.country ?? "—"}</td>
                      <td>{label(c.residency)}</td>
                      <td className="text-right">
                        {c._count.quotes} / {c._count.bookings}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No customers found.</Empty>
          )}
        </div>
        <Card title="Add customer">
          <form action={createCustomer} className="space-y-3">
            <Field label="Name *">
              <input name="name" required className="input" />
            </Field>
            <Field label="Email">
              <input name="email" type="email" className="input" />
            </Field>
            <Field label="Phone">
              <input name="phone" className="input" />
            </Field>
            <Field label="Company / agent">
              <input name="company" className="input" />
            </Field>
            <Field label="Country">
              <input name="country" className="input" />
            </Field>
            <Field label="Residency">
              <EnumSelect name="residency" values={["NON_RESIDENT", "RESIDENT"]} />
            </Field>
            <SubmitButton>Add customer</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
