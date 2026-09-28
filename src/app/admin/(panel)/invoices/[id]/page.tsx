import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { addPayment, deleteInvoice, deletePayment, setInvoiceStatus, updateInvoice } from "@/app/actions/finance";
import { date, label, money } from "@/lib/format";
import { invoiceTotals } from "@/lib/totals";
import { Badge, Card, EnumSelect, Field, PageHeader, Stat } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import { InvoiceForm } from "../InvoiceForm";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const inv = await db.invoice.findUnique({
    where: { id },
    include: { customer: true, booking: true, items: { orderBy: { sort: "asc" } }, payments: { orderBy: { date: "desc" } } },
  });
  if (!inv) notFound();
  const t = invoiceTotals(inv);
  const overdue = ["SENT", "PARTIAL"].includes(inv.status) && inv.dueDate < new Date();

  return (
    <>
      <PageHeader
        title={inv.number}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/customers/${inv.customerId}`} className="text-brand-700 hover:underline">
              {inv.customer.name}
            </Link>
            {inv.booking && (
              <>
                ·{" "}
                <Link href={`/admin/bookings/${inv.booking.id}`} className="text-brand-700 hover:underline">
                  {inv.booking.ref}
                </Link>
              </>
            )}
            <Badge value={overdue ? "OVERDUE" : inv.status} />
          </span>
        }
        back={{ href: "/admin/invoices", label: "Invoices" }}
        actions={
          <>
            <a href={`/admin/print/invoice/${inv.id}`} target="_blank" className="btn-outline">
              Print / PDF
            </a>
            {inv.status === "DRAFT" && (
              <form action={setInvoiceStatus.bind(null, inv.id, "SENT")}>
                <SubmitButton className="btn-primary">Mark as sent</SubmitButton>
              </form>
            )}
            {inv.status !== "VOID" && inv.status !== "PAID" && (
              <form action={setInvoiceStatus.bind(null, inv.id, "VOID")}>
                <SubmitButton className="btn-outline">Void</SubmitButton>
              </form>
            )}
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Invoice total" value={money(t.total, inv.currency)} hint={`Due ${date(inv.dueDate)}`} />
        <Stat label="Paid" value={money(t.paid, inv.currency)} />
        <Stat label="Balance" value={<span className={t.balance > 0 ? "text-accent-600" : "text-emerald-700"}>{money(t.balance, inv.currency)}</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InvoiceForm action={updateInvoice.bind(null, inv.id)} inv={inv} submitLabel="Save invoice" />
          <form action={deleteInvoice.bind(null, inv.id)} className="mt-8">
            <ConfirmButton message="Delete this invoice and its payments?">Delete invoice</ConfirmButton>
          </form>
        </div>
        <div className="space-y-6">
          <Card title="Record payment">
            <form action={addPayment.bind(null, inv.id)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label={`Amount (${inv.currency})`}>
                  <input name="amount" type="number" step="0.01" required defaultValue={t.balance > 0 ? t.balance : ""} className="input" />
                </Field>
                <Field label="Date">
                  <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input" />
                </Field>
              </div>
              <Field label="Method">
                <EnumSelect name="method" values={["MPESA", "BANK", "CASH", "CARD", "CHEQUE", "OTHER"]} defaultValue="MPESA" />
              </Field>
              <Field label="Reference (M-Pesa code, bank ref…)">
                <input name="reference" className="input" placeholder="e.g. SJK4XY12AB" />
              </Field>
              <Field label="Notes">
                <input name="notes" className="input" />
              </Field>
              <SubmitButton>Add payment</SubmitButton>
            </form>
          </Card>
          <Card title="Payment history">
            {inv.payments.length ? (
              <ul className="divide-y divide-stone-100 text-sm">
                {inv.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                    <span>
                      <strong>{money(p.amount, inv.currency)}</strong>
                      <span className="block text-xs text-stone-500">
                        {date(p.date)} · {label(p.method)} {p.reference}
                      </span>
                    </span>
                    <form action={deletePayment.bind(null, p.id)}>
                      <ConfirmButton message="Delete this payment?">✕</ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No payments yet.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
