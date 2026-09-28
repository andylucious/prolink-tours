import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteCustomer, updateCustomer } from "@/app/actions/crm";
import { date, money } from "@/lib/format";
import { invoiceTotals, quoteTotals } from "@/lib/totals";
import { Badge, Card, EnumSelect, Field, PageHeader } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const id = Number((await params).id);
  const { error } = await searchParams;
  const c = await db.customer.findUnique({
    where: { id },
    include: {
      quotes: { include: { items: true }, orderBy: { createdAt: "desc" } },
      bookings: { orderBy: { startDate: "desc" } },
      invoices: { include: { items: true, payments: true }, orderBy: { issueDate: "desc" } },
      inquiries: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) notFound();

  return (
    <>
      <PageHeader
        title={c.name}
        subtitle={[c.company, c.email, c.phone].filter(Boolean).join(" · ")}
        back={{ href: "/admin/customers", label: "Customers" }}
        actions={
          <Link href={`/admin/quotes/new?customerId=${c.id}`} className="btn-primary">
            + New quote
          </Link>
        }
      />
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">This customer has quotes, bookings or invoices and can&apos;t be deleted.</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Bookings">
            {c.bookings.length ? (
              <ul className="divide-y divide-stone-100 text-sm">
                {c.bookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/bookings/${b.id}`} className="text-brand-700 hover:underline">
                      {b.ref} — {b.title} <span className="text-stone-500">({date(b.startDate)})</span>
                    </Link>
                    <Badge value={b.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No bookings.</p>
            )}
          </Card>
          <Card title="Quotes">
            {c.quotes.length ? (
              <ul className="divide-y divide-stone-100 text-sm">
                {c.quotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/quotes/${q.id}`} className="text-brand-700 hover:underline">
                      {q.number} — {q.title}
                    </Link>
                    <span className="flex items-center gap-3">
                      {money(quoteTotals(q.items, q.discount).total, q.currency)} <Badge value={q.status} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No quotes.</p>
            )}
          </Card>
          <Card title="Invoices">
            {c.invoices.length ? (
              <ul className="divide-y divide-stone-100 text-sm">
                {c.invoices.map((i) => {
                  const t = invoiceTotals(i);
                  return (
                    <li key={i.id} className="flex items-center justify-between py-2">
                      <Link href={`/admin/invoices/${i.id}`} className="text-brand-700 hover:underline">
                        {i.number}
                      </Link>
                      <span className="flex items-center gap-3">
                        {money(t.total, i.currency)} <span className="text-xs text-stone-500">bal {money(t.balance, i.currency)}</span> <Badge value={i.status} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No invoices.</p>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Details">
            <form action={updateCustomer.bind(null, c.id)} className="space-y-3">
              <Field label="Name">
                <input name="name" defaultValue={c.name} required className="input" />
              </Field>
              <Field label="Email">
                <input name="email" type="email" defaultValue={c.email ?? ""} className="input" />
              </Field>
              <Field label="Phone">
                <input name="phone" defaultValue={c.phone ?? ""} className="input" />
              </Field>
              <Field label="Company / agent">
                <input name="company" defaultValue={c.company ?? ""} className="input" />
              </Field>
              <Field label="Country">
                <input name="country" defaultValue={c.country ?? ""} className="input" />
              </Field>
              <Field label="Residency">
                <EnumSelect name="residency" values={["NON_RESIDENT", "RESIDENT"]} defaultValue={c.residency} />
              </Field>
              <Field label="Notes">
                <textarea name="notes" rows={3} defaultValue={c.notes ?? ""} className="input" />
              </Field>
              <SubmitButton>Save</SubmitButton>
            </form>
          </Card>
          <form action={deleteCustomer.bind(null, c.id)}>
            <ConfirmButton message="Delete this customer?">Delete customer</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
