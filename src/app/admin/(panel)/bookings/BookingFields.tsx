import { db } from "@/lib/db";
import { CURRENCIES, dateInput, toNum } from "@/lib/format";
import { EnumSelect, Field } from "@/components/admin/ui";

type B = {
  customerId?: number;
  tourId?: number | null;
  title?: string;
  startDate?: Date;
  endDate?: Date;
  adults?: number;
  children?: number;
  currency?: string;
  total?: unknown;
  status?: string;
  notes?: string | null;
};

export async function BookingFields({ b = {} }: { b?: B }) {
  const [customers, tours] = await Promise.all([
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.tour.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Field label="Customer *" className="md:col-span-2">
        <select name="customerId" required defaultValue={b.customerId ?? ""} className="input">
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
      <Field label="Tour" className="md:col-span-2">
        <select name="tourId" defaultValue={b.tourId ?? ""} className="input">
          <option value="">Custom</option>
          {tours.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title *" className="md:col-span-4">
        <input name="title" required defaultValue={b.title ?? ""} className="input" />
      </Field>
      <Field label="Start date *">
        <input name="startDate" type="date" required defaultValue={dateInput(b.startDate)} className="input" />
      </Field>
      <Field label="End date *">
        <input name="endDate" type="date" required defaultValue={dateInput(b.endDate)} className="input" />
      </Field>
      <Field label="Adults">
        <input name="adults" type="number" min={0} defaultValue={b.adults ?? 2} className="input" />
      </Field>
      <Field label="Children">
        <input name="children" type="number" min={0} defaultValue={b.children ?? 0} className="input" />
      </Field>
      <Field label="Currency">
        <EnumSelect name="currency" values={CURRENCIES} defaultValue={b.currency ?? "USD"} />
      </Field>
      <Field label="Booking value">
        <input name="total" type="number" step="0.01" defaultValue={toNum(b.total as number)} className="input" />
      </Field>
      <Field label="Status">
        <EnumSelect name="status" values={["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]} defaultValue={b.status ?? "CONFIRMED"} />
      </Field>
      <Field label="Operational notes" className="md:col-span-4">
        <textarea name="notes" rows={3} defaultValue={b.notes ?? ""} className="input" placeholder="Flight numbers, dietary needs, pick-up points…" />
      </Field>
    </div>
  );
}
