import { db } from "@/lib/db";
import { CURRENCIES, dateInput, toNum } from "@/lib/format";
import { Card, EnumSelect, Field } from "@/components/admin/ui";
import { LineItemsEditor, SubmitButton } from "@/components/admin/client";

type Inv = {
  customerId?: number;
  bookingId?: number | null;
  issueDate?: Date;
  dueDate?: Date;
  currency?: string;
  discount?: unknown;
  taxRate?: unknown;
  notes?: string | null;
  items?: { description: string; quantity: unknown; unitPrice: unknown }[];
};

export async function InvoiceForm({ action, inv = {}, submitLabel }: { action: (fd: FormData) => Promise<void>; inv?: Inv; submitLabel: string }) {
  const [customers, bookings] = await Promise.all([
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.booking.findMany({ select: { id: true, ref: true, title: true }, orderBy: { startDate: "desc" }, take: 300 }),
  ]);
  const currency = inv.currency ?? "USD";
  return (
    <form action={action} className="space-y-6">
      <Card title="Invoice details">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Customer *" className="md:col-span-2">
            <select name="customerId" required defaultValue={inv.customerId ?? ""} className="input">
              <option value="" disabled>
                Select…
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Booking" className="md:col-span-2">
            <select name="bookingId" defaultValue={inv.bookingId ?? ""} className="input">
              <option value="">— none —</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.ref} · {b.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Issue date">
            <input name="issueDate" type="date" defaultValue={dateInput(inv.issueDate ?? new Date())} className="input" />
          </Field>
          <Field label="Due date">
            <input name="dueDate" type="date" defaultValue={dateInput(inv.dueDate ?? new Date(Date.now() + 14 * 86400000))} className="input" />
          </Field>
          <Field label="Currency">
            <EnumSelect name="currency" values={CURRENCIES} defaultValue={currency} />
          </Field>
        </div>
      </Card>
      <Card title="Items">
        <LineItemsEditor
          initial={(inv.items ?? []).map((i) => ({ description: i.description, quantity: toNum(i.quantity as number), unitPrice: toNum(i.unitPrice as number) }))}
          currency={currency}
          discount={toNum(inv.discount as number)}
          taxRate={toNum(inv.taxRate as number)}
        />
      </Card>
      <Card title="Notes">
        <textarea name="notes" rows={3} defaultValue={inv.notes ?? ""} className="input" />
      </Card>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
