import { db } from "@/lib/db";
import { CURRENCIES, label, toNum } from "@/lib/format";
import { Card, EnumSelect, Field } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";

type T = {
  title?: string;
  slug?: string;
  summary?: string;
  description?: string;
  destination?: string;
  durationDays?: number;
  categoryId?: number;
  inclusions?: string;
  exclusions?: string;
  priceFrom?: unknown;
  currency?: string;
  featured?: boolean;
  published?: boolean;
  coverImage?: string | null;
  addOns?: { id: number }[];
};

export async function TourForm({ action, tour = {}, submitLabel }: { action: (fd: FormData) => Promise<void>; tour?: T; submitLabel: string }) {
  const [categories, addOns] = await Promise.all([db.category.findMany({ orderBy: { sort: "asc" } }), db.addOn.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] })]);
  const linked = new Set((tour.addOns ?? []).map((a) => a.id));

  return (
    <form action={action} className="space-y-6">
      <Card title="Basics">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Title *" className="md:col-span-3">
            <input name="title" required defaultValue={tour.title ?? ""} className="input" />
          </Field>
          <Field label="Category *">
            <select name="categoryId" required defaultValue={tour.categoryId ?? ""} className="input">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Destination *" className="md:col-span-2">
            <input name="destination" required defaultValue={tour.destination ?? ""} className="input" placeholder="Maasai Mara, Kenya" />
          </Field>
          <Field label="Duration (days)">
            <input name="durationDays" type="number" min={1} defaultValue={tour.durationDays ?? 3} className="input" />
          </Field>
          <Field label="URL slug">
            <input name="slug" defaultValue={tour.slug ?? ""} className="input" placeholder="auto from title" />
          </Field>
          <Field label="Short summary (cards & Google) *" className="md:col-span-4">
            <input name="summary" required maxLength={480} defaultValue={tour.summary ?? ""} className="input" />
          </Field>
          <Field label="Full description" className="md:col-span-4">
            <textarea name="description" rows={5} defaultValue={tour.description ?? ""} className="input" />
          </Field>
          <Field label="'From' price per person">
            <input name="priceFrom" type="number" step="0.01" defaultValue={toNum(tour.priceFrom as number)} className="input" />
          </Field>
          <Field label="Currency">
            <EnumSelect name="currency" values={CURRENCIES} defaultValue={tour.currency ?? "USD"} />
          </Field>
          <div className="flex items-end gap-6 md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="published" defaultChecked={tour.published ?? true} className="accent-brand-600" /> Published on website
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={tour.featured ?? false} className="accent-brand-600" /> Best-seller (home page)
            </label>
          </div>
        </div>
      </Card>

      <Card title="Cover photo">
        <div className="grid gap-4 md:grid-cols-3">
          {tour.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tour.coverImage} alt="" className="h-32 w-full rounded-lg object-cover" />
          )}
          <Field label="Upload new image">
            <input name="coverFile" type="file" accept="image/*" className="input" />
          </Field>
          <Field label="…or image URL">
            <input name="coverImage" defaultValue={tour.coverImage ?? ""} className="input" />
          </Field>
        </div>
      </Card>

      <Card title="Inclusions & exclusions (one per line)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Included">
            <textarea name="inclusions" rows={8} defaultValue={tour.inclusions ?? ""} className="input" />
          </Field>
          <Field label="Not included">
            <textarea name="exclusions" rows={8} defaultValue={tour.exclusions ?? ""} className="input" />
          </Field>
        </div>
      </Card>

      <Card title="Available add-ons">
        <div className="grid gap-2 md:grid-cols-2">
          {addOns.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="addOnIds" value={a.id} defaultChecked={linked.has(a.id)} className="accent-brand-600" />
              {a.name} <span className="text-xs text-stone-400">({label(a.type)})</span>
            </label>
          ))}
          {!addOns.length && <p className="text-sm text-stone-500">Create add-ons under Categories & pricing.</p>}
        </div>
      </Card>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
