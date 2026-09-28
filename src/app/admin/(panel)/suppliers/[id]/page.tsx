import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { updateSupplier } from "@/app/actions/ops";
import { deleteSupplierPayment } from "@/app/actions/finance";
import { fmtMulti, payables } from "@/lib/finance";
import { date, label, money } from "@/lib/format";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import { SupplierFields } from "../SupplierFields";

export default async function SupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [s, pay] = await Promise.all([
    db.supplier.findUnique({
      where: { id },
      include: {
        services: { include: { booking: { include: { customer: true } } }, orderBy: { serviceDate: "desc" }, take: 100 },
        payments: { orderBy: { date: "desc" }, include: { service: true } },
      },
    }),
    payables(),
  ]);
  if (!s) notFound();

  return (
    <>
      <PageHeader
        title={s.name}
        subtitle={`${label(s.type)}${s.location ? ` · ${s.location}` : ""}`}
        back={{ href: "/admin/suppliers", label: "Suppliers" }}
        actions={
          <Link href={`/admin/supplier-payments?supplierId=${s.id}`} className="btn-primary">
            Record payment
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={<>Balance owed: <span className="text-accent-600">{fmtMulti(pay.perSupplier.get(s.id) ?? {})}</span></>}>
            <p className="text-sm text-stone-500">Total of non-cancelled services booked with this supplier, less payments made.</p>
          </Card>
          <Card title="Booked services">
            {s.services.length ? (
              <div className="-m-5 overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Booking</th>
                      <th>Service</th>
                      <th className="text-right">Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.services.map((v) => (
                      <tr key={v.id}>
                        <td className="whitespace-nowrap">{date(v.serviceDate)}</td>
                        <td>
                          <Link href={`/admin/bookings/${v.bookingId}`} className="text-brand-700 hover:underline">
                            {v.booking.ref}
                          </Link>
                          <p className="text-xs text-stone-500">{v.booking.customer.name}</p>
                        </td>
                        <td className="text-xs">
                          {v.description}
                          <p className="text-stone-400">{v.voucherNo}</p>
                        </td>
                        <td className="whitespace-nowrap text-right">{money(v.cost, v.currency)}</td>
                        <td>
                          <Badge value={v.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-stone-500">No services booked yet.</p>
            )}
          </Card>
          <Card title="Payments made">
            {s.payments.length ? (
              <ul className="divide-y divide-stone-100 text-sm">
                {s.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <span>
                      {date(p.date)} · {label(p.method)} {p.reference && <span className="text-stone-500">({p.reference})</span>}
                      {p.service && <span className="block text-xs text-stone-500">for {p.service.voucherNo}</span>}
                    </span>
                    <span className="flex items-center gap-3">
                      <strong>{money(p.amount, p.currency)}</strong>
                      <form action={deleteSupplierPayment.bind(null, p.id)}>
                        <ConfirmButton message="Delete this payment record?">✕</ConfirmButton>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No payments recorded.</p>
            )}
          </Card>
        </div>
        <Card title="Supplier details">
          <form action={updateSupplier.bind(null, s.id)} className="space-y-4">
            <SupplierFields s={s} />
            <SubmitButton>Save</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
