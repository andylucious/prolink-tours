import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { date, label, money, toNum } from "@/lib/format";
import { invoiceTotals } from "@/lib/totals";
import { ItemsTable, PrintShell, TotalsBlock } from "../../PrintShell";

export default async function PrintInvoice({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  const [inv, s] = await Promise.all([
    db.invoice.findUnique({ where: { id }, include: { customer: true, booking: true, items: { orderBy: { sort: "asc" } }, payments: { orderBy: { date: "asc" } } } }),
    getSettings(),
  ]);
  if (!inv) notFound();
  const t = invoiceTotals(inv);

  return (
    <PrintShell s={s} docType={inv.status === "PAID" ? "Receipt" : "Invoice"} number={inv.number} closeHref={`/admin/invoices/${inv.id}`}>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs uppercase text-stone-500">Bill to</p>
          <p className="font-semibold">{inv.customer.name}</p>
          {inv.customer.company && <p>{inv.customer.company}</p>}
          <p>{inv.customer.email}</p>
          <p>{inv.customer.phone}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-stone-500">Issue date:</span> {date(inv.issueDate)}
          </p>
          <p>
            <span className="text-stone-500">Due date:</span> {date(inv.dueDate)}
          </p>
          {inv.booking && (
            <p>
              <span className="text-stone-500">Booking:</span> {inv.booking.ref}
            </p>
          )}
          <p className="mt-2 inline-block rounded bg-stone-100 px-2 py-0.5 text-xs font-bold uppercase">{label(inv.status)}</p>
        </div>
      </div>

      <ItemsTable rows={inv.items.map((i) => ({ description: i.description, quantity: toNum(i.quantity), unitPrice: toNum(i.unitPrice) }))} currency={inv.currency} />
      <TotalsBlock
        rows={[
          ["Subtotal", money(t.subtotal, inv.currency)],
          ...(toNum(inv.discount) ? ([["Discount", `− ${money(inv.discount, inv.currency)}`]] as [string, string][]) : []),
          ...(toNum(inv.taxRate) ? ([[`Tax (${toNum(inv.taxRate)}%)`, money(t.tax, inv.currency)]] as [string, string][]) : []),
          ["Total", money(t.total, inv.currency), true],
          ["Paid", money(t.paid, inv.currency)],
          ["Balance due", money(t.balance, inv.currency), true],
        ]}
      />

      {inv.payments.length > 0 && (
        <div className="mt-6 break-inside-avoid">
          <p className="font-semibold">Payments received</p>
          <table className="mt-1 w-full text-xs">
            <tbody>
              {inv.payments.map((p) => (
                <tr key={p.id} className="border-b border-stone-100">
                  <td className="py-1">{date(p.date)}</td>
                  <td>{label(p.method)}</td>
                  <td>{p.reference}</td>
                  <td className="text-right">{money(p.amount, inv.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {inv.notes && <p className="mt-6 whitespace-pre-line rounded bg-stone-50 p-3">{inv.notes}</p>}
      <div className="mt-6 grid grid-cols-2 gap-6 border-t pt-4 text-xs text-stone-600">
        <p className="whitespace-pre-line">
          <strong>Bank transfer</strong>
          {"\n"}
          {s.bankDetails}
        </p>
        <p className="whitespace-pre-line">
          <strong>M-Pesa</strong>
          {"\n"}
          {s.mpesaDetails}
          {"\n\n"}
          {s.invoiceTerms}
        </p>
      </div>
    </PrintShell>
  );
}
