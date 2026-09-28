import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { addService, deleteBooking, deleteService, invoiceBooking, setServiceStatus, updateBooking } from "@/app/actions/ops";
import { CURRENCIES, date, money, toNum } from "@/lib/format";
import { invoiceTotals } from "@/lib/totals";
import { Badge, Card, EnumSelect, Field, PageHeader, Stat } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import { BookingFields } from "../BookingFields";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [b, suppliers] = await Promise.all([
    db.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        quote: true,
        services: { include: { supplier: true, payments: true }, orderBy: { serviceDate: "asc" } },
        invoices: { include: { items: true, payments: true } },
      },
    }),
    db.supplier.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!b) notFound();

  const cost = b.services.filter((s) => s.status !== "CANCELLED").reduce((s, x) => s + toNum(x.cost), 0);
  const invoiced = b.invoices.filter((i) => i.status !== "VOID").reduce((s, i) => s + invoiceTotals(i).total, 0);
  const paid = b.invoices.reduce((s, i) => s + invoiceTotals(i).paid, 0);

  return (
    <>
      <PageHeader
        title={b.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {b.ref} ·{" "}
            <Link href={`/admin/customers/${b.customerId}`} className="text-brand-700 hover:underline">
              {b.customer.name}
            </Link>
            · {date(b.startDate)} → {date(b.endDate)} <Badge value={b.status} />
            {b.quote && (
              <Link href={`/admin/quotes/${b.quote.id}`} className="text-xs text-stone-500 underline">
                quote {b.quote.number}
              </Link>
            )}
          </span>
        }
        back={{ href: "/admin/bookings", label: "Bookings" }}
        actions={
          <a href={`/admin/print/booking/${b.id}`} target="_blank" rel="noopener noreferrer" className="btn-outline">
            🖨 Print / PDF
          </a>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Booking value" value={money(b.total, b.currency)} />
        <Stat label="Supplier costs" value={money(cost, b.currency)} hint={`Margin ${money(toNum(b.total) - cost, b.currency)}`} />
        <Stat label="Invoiced" value={money(invoiced, b.currency)} />
        <Stat label="Received" value={money(paid, b.currency)} hint={`Outstanding ${money(invoiced - paid, b.currency)}`} />
      </div>

      <div className="space-y-6">
        <Card title="Supplier services & vouchers">
          {b.services.length > 0 && (
            <div className="-mx-5 -mt-5 mb-5 overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier / service</th>
                    <th className="text-right">Cost</th>
                    <th className="text-right">Paid</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {b.services.map((s) => {
                    const spaid = s.payments.reduce((a, p) => a + toNum(p.amount), 0);
                    return (
                      <tr key={s.id}>
                        <td className="whitespace-nowrap">{date(s.serviceDate)}</td>
                        <td>
                          {s.supplier ? (
                            <Link href={`/admin/suppliers/${s.supplier.id}`} className="font-medium text-brand-700 hover:underline">
                              {s.supplier.name}
                            </Link>
                          ) : (
                            <span className="text-stone-400">No supplier</span>
                          )}
                          <p className="text-xs text-stone-600">{s.description}</p>
                          <p className="text-xs text-stone-400">{s.voucherNo}</p>
                        </td>
                        <td className="whitespace-nowrap text-right">{money(s.cost, s.currency)}</td>
                        <td className="whitespace-nowrap text-right">{money(spaid, s.currency)}</td>
                        <td>
                          <Badge value={s.status} />
                        </td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <a href={`/admin/print/voucher/${s.id}`} target="_blank" className="btn-outline btn-sm">
                              Voucher
                            </a>
                            {s.status !== "CONFIRMED" && (
                              <form action={setServiceStatus.bind(null, s.id, "CONFIRMED")}>
                                <button className="btn-outline btn-sm">Confirm</button>
                              </form>
                            )}
                            {s.status !== "CANCELLED" && (
                              <form action={setServiceStatus.bind(null, s.id, "CANCELLED")}>
                                <button className="btn-outline btn-sm">Cancel</button>
                              </form>
                            )}
                            {s.supplier && (
                              <Link href={`/admin/supplier-payments?supplierId=${s.supplier.id}&serviceId=${s.id}`} className="btn-outline btn-sm">
                                Pay
                              </Link>
                            )}
                            <form action={deleteService.bind(null, s.id)}>
                              <ConfirmButton message="Remove this service?">✕</ConfirmButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <form action={addService.bind(null, b.id)} className="grid gap-3 md:grid-cols-6">
            <Field label="Supplier" className="md:col-span-2">
              <select name="supplierId" className="input">
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Service *" className="md:col-span-2">
              <input name="description" required className="input" placeholder="e.g. 2 nights full board, 1 double" />
            </Field>
            <Field label="Date">
              <input name="serviceDate" type="date" defaultValue={b.startDate.toISOString().slice(0, 10)} className="input" />
            </Field>
            <Field label="Qty">
              <input name="quantity" type="number" step="0.01" defaultValue={1} className="input" />
            </Field>
            <Field label="Total cost">
              <input name="cost" type="number" step="0.01" defaultValue={0} className="input" />
            </Field>
            <Field label="Currency">
              <EnumSelect name="currency" values={CURRENCIES} defaultValue={b.currency} />
            </Field>
            <div className="flex items-end md:col-span-4">
              <SubmitButton className="btn-outline">+ Add service</SubmitButton>
            </div>
          </form>
        </Card>

        <Card title="Invoices">
          {b.invoices.length > 0 && (
            <ul className="mb-4 divide-y divide-stone-100 text-sm">
              {b.invoices.map((i) => {
                const t = invoiceTotals(i);
                return (
                  <li key={i.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/invoices/${i.id}`} className="text-brand-700 hover:underline">
                      {i.number} · due {date(i.dueDate)}
                    </Link>
                    <span className="flex items-center gap-3">
                      {money(t.total, i.currency)} <span className="text-xs text-stone-500">bal {money(t.balance, i.currency)}</span> <Badge value={i.status} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <form action={invoiceBooking.bind(null, b.id)} className="flex flex-wrap items-end gap-3">
            <Field label="Invoice % of booking">
              <select name="percent" className="input w-44" defaultValue={b.invoices.length ? "50" : "100"}>
                <option value="100">100% (full amount)</option>
                <option value="50">50% deposit / balance</option>
                <option value="30">30% deposit</option>
              </select>
            </Field>
            <SubmitButton>Create invoice</SubmitButton>
          </form>
        </Card>

        <Card title="Booking details">
          <form action={updateBooking.bind(null, b.id)}>
            <BookingFields b={b} />
            <div className="mt-5">
              <SubmitButton>Save booking</SubmitButton>
            </div>
          </form>
        </Card>
        <form action={deleteBooking.bind(null, b.id)}>
          <ConfirmButton message="Delete this booking and its services? Invoices will be kept but unlinked.">Delete booking</ConfirmButton>
        </form>
      </div>
    </>
  );
}
