import Link from "next/link";
import { db } from "@/lib/db";
import { addSupplierPayment, deleteSupplierPayment } from "@/app/actions/finance";
import { CURRENCIES, date, label, money, toNum } from "@/lib/format";
import { Card, EnumSelect, Empty, Field, PageHeader } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";

export const metadata = { title: "Supplier payments" };
const METHODS = ["MPESA", "BANK", "CASH", "CARD", "CHEQUE", "OTHER"] as const;

export default async function SupplierPaymentsPage({ searchParams }: { searchParams: Promise<{ supplierId?: string; serviceId?: string }> }) {
  const sp = await searchParams;
  const supplierId = sp.supplierId ? Number(sp.supplierId) : undefined;
  const serviceId = sp.serviceId ? Number(sp.serviceId) : undefined;
  const [suppliers, payments, services] = await Promise.all([
    db.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.supplierPayment.findMany({ include: { supplier: true, service: { include: { booking: true } } }, orderBy: { date: "desc" }, take: 200 }),
    supplierId
      ? db.bookingService.findMany({ where: { supplierId, status: { not: "CANCELLED" } }, include: { booking: true }, orderBy: { serviceDate: "desc" }, take: 50 })
      : Promise.resolve([]),
  ]);
  const svc = services.find((s) => s.id === serviceId);

  return (
    <>
      <PageHeader title="Supplier payments" subtitle="Money paid out to lodges, transporters and other suppliers." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {payments.length ? (
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>For</th>
                    <th>Method / ref</th>
                    <th className="text-right">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="whitespace-nowrap">{date(p.date)}</td>
                      <td>
                        <Link href={`/admin/suppliers/${p.supplierId}`} className="text-brand-700 hover:underline">
                          {p.supplier.name}
                        </Link>
                      </td>
                      <td className="text-xs">
                        {p.service ? (
                          <Link href={`/admin/bookings/${p.service.bookingId}`} className="hover:underline">
                            {p.service.booking.ref} · {p.service.voucherNo}
                          </Link>
                        ) : (
                          (p.notes ?? "—")
                        )}
                      </td>
                      <td className="text-xs">
                        {label(p.method)}
                        <p className="text-stone-500">{p.reference}</p>
                      </td>
                      <td className="whitespace-nowrap text-right font-medium">{money(p.amount, p.currency)}</td>
                      <td>
                        <form action={deleteSupplierPayment.bind(null, p.id)}>
                          <ConfirmButton message="Delete this payment?">✕</ConfirmButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No supplier payments recorded.</Empty>
          )}
        </div>
        <Card title="Record a payment">
          {/* Picking a supplier reloads the page to list their services. */}
          <form className="mb-4 flex gap-2">
            <select name="supplierId" defaultValue={supplierId ?? ""} className="input">
              <option value="">Choose supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button className="btn-outline">Load</button>
          </form>
          {supplierId ? (
            <form action={addSupplierPayment} className="space-y-3">
              <input type="hidden" name="supplierId" value={supplierId} />
              <input type="hidden" name="back" value={`/admin/suppliers/${supplierId}`} />
              <Field label="For service (optional)">
                <select name="serviceId" defaultValue={serviceId ?? ""} className="input">
                  <option value="">General / on account</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.booking.ref} · {date(s.serviceDate)} · {money(s.cost, s.currency)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount *">
                  <input name="amount" type="number" step="0.01" required defaultValue={svc ? toNum(svc.cost) : ""} className="input" />
                </Field>
                <Field label="Currency">
                  <EnumSelect name="currency" values={CURRENCIES} defaultValue={svc?.currency ?? "USD"} />
                </Field>
                <Field label="Date">
                  <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input" />
                </Field>
                <Field label="Method">
                  <EnumSelect name="method" values={METHODS} defaultValue="BANK" />
                </Field>
              </div>
              <Field label="Reference (M-Pesa code, cheque no…)">
                <input name="reference" className="input" />
              </Field>
              <Field label="Notes">
                <input name="notes" className="input" />
              </Field>
              <SubmitButton>Save payment</SubmitButton>
            </form>
          ) : (
            <p className="text-sm text-stone-500">Choose a supplier first.</p>
          )}
        </Card>
      </div>
    </>
  );
}
