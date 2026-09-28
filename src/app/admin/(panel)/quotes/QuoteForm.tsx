import { db } from "@/lib/db";
import { CURRENCIES, dateInput, toNum } from "@/lib/format";
import { Card, EnumSelect, Field } from "@/components/admin/ui";
import { LineItemsEditor, SubmitButton, type LineItem } from "@/components/admin/client";

type QuoteLike = {
  customerId?: number;
  tourId?: number | null;
  title?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  adults?: number;
  children?: number;
  currency?: string;
  validUntil?: Date | null;
  discount?: unknown;
  notes?: string | null;
  items?: { description: string; supplierId: number | null; serviceDate: Date | null; quantity: unknown; unitCost: unknown; unitPrice: unknown }[];
};

export async function QuoteForm({ action, quote = {}, submitLabel }: { action: (fd: FormData) => Promise<void>; quote?: QuoteLike; submitLabel: string }) {
  const [customers, tours, suppliers] = await Promise.all([
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.tour.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.supplier.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const items: LineItem[] = (quote.items ?? []).map((i) => ({
    description: i.description,
    supplierId: i.supplierId,
    serviceDate: dateInput(i.serviceDate),
    quantity: toNum(i.quantity as number),
    unitCost: toNum(i.unitCost as number),
    unitPrice: toNum(i.unitPrice as number),
  }));
  const currency = quote.currency ?? "USD";

  return (
    <form action={action} className="space-y-6">
      <Card title="Trip details">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Customer *" className="md:col-span-2">
            <select name="customerId" required defaultValue={quote.customerId ?? ""} className="input">
              <option value="" disabled>
                Select customer…
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Based on tour" className="md:col-span-2">
            <select name="tourId" defaultValue={quote.tourId ?? ""} className="input">
              <option value="">Custom itinerary</option>
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quote title *" className="md:col-span-4">
            <input name="title" required defaultValue={quote.title ?? ""} className="input" placeholder="e.g. 5-Day Mara & Nakuru Family Safari" />
          </Field>
          <Field label="Start date">
            <input name="startDate" type="date" defaultValue={dateInput(quote.startDate)} className="input" />
          </Field>
          <Field label="End date">
            <input name="endDate" type="date" defaultValue={dateInput(quote.endDate)} className="input" />
          </Field>
          <Field label="Adults">
            <input name="adults" type="number" min={0} defaultValue={quote.adults ?? 2} className="input" />
          </Field>
          <Field label="Children">
            <input name="children" type="number" min={0} defaultValue={quote.children ?? 0} className="input" />
          </Field>
          <Field label="Currency">
            <EnumSelect name="currency" values={CURRENCIES} defaultValue={currency} />
          </Field>
          <Field label="Valid until">
            <input name="validUntil" type="date" defaultValue={dateInput(quote.validUntil ?? new Date(Date.now() + 14 * 86400000))} className="input" />
          </Field>
        </div>
      </Card>
      <Card title="Price breakdown">
        <p className="mb-3 text-xs text-stone-500">
          <strong>Unit cost</strong> is what the supplier charges you (internal only). <strong>Unit price</strong> is what the client sees. Lines with a supplier become vouchers
          when the quote is accepted.
        </p>
        <LineItemsEditor initial={items} suppliers={suppliers} withCost currency={currency} discount={toNum(quote.discount as number)} />
      </Card>
      <Card title="Notes for the client">
        <textarea name="notes" rows={4} defaultValue={quote.notes ?? ""} className="input" placeholder="Terms, what's included, payment instructions…" />
      </Card>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
