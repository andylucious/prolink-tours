import { db } from "@/lib/db";
import { deleteAddOn, deleteCategory, deleteSeason, saveAddOn, saveCategory, saveSeason } from "@/app/actions/catalog";
import { CURRENCIES, date, dateInput, label, money, toNum } from "@/lib/format";
import { unitLabel } from "@/lib/pricing";
import { Card, EnumSelect, PageHeader } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";

export const metadata = { title: "Categories & pricing" };
const ADDON_TYPES = ["CAR_HIRE", "FLIGHT", "ACCOMMODATION_UPGRADE", "ACTIVITY", "OTHER"] as const;
const UNITS = ["PER_PERSON", "PER_GROUP", "PER_DAY", "PER_PERSON_PER_DAY"] as const;

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const [categories, addOns, seasons] = await Promise.all([
    db.category.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { tours: true } } } }),
    db.addOn.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }], include: { _count: { select: { tours: true } } } }),
    db.season.findMany({ orderBy: { startDate: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Categories & pricing" subtitle="Tour categories, optional add-ons and peak-season dates used by the price estimator." />
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">That category still has tours — move them first.</p>}

      <div className="space-y-8">
        <Card title="Tour categories">
          <div className="space-y-3">
            {categories.map((c) => (
              <form key={c.id} action={saveCategory} className="grid items-end gap-3 rounded-lg border border-stone-100 p-3 md:grid-cols-12">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} className="input md:col-span-2" required />
                <input name="description" defaultValue={c.description ?? ""} className="input md:col-span-4" placeholder="Description" />
                <input name="image" defaultValue={c.image ?? ""} className="input md:col-span-2" placeholder="Image URL" />
                <input name="imageFile" type="file" accept="image/*" className="input md:col-span-2" />
                <input name="sort" type="number" defaultValue={c.sort} className="input md:col-span-1" title="Order" />
                <div className="flex gap-1 md:col-span-1">
                  <SubmitButton className="btn-outline btn-sm">Save</SubmitButton>
                </div>
                <p className="text-xs text-stone-400 md:col-span-12">
                  {c._count.tours} tours · /tours?category={c.slug}
                </p>
              </form>
            ))}
            <form action={saveCategory} className="grid items-end gap-3 rounded-lg bg-sand-100 p-3 md:grid-cols-12">
              <input name="name" required className="input md:col-span-3" placeholder="New category name" />
              <input name="description" className="input md:col-span-5" placeholder="Description" />
              <input name="image" className="input md:col-span-3" placeholder="Image URL" />
              <div className="md:col-span-1">
                <SubmitButton className="btn-primary btn-sm">Add</SubmitButton>
              </div>
            </form>
            <div className="flex flex-wrap gap-2 pt-2">
              {categories
                .filter((c) => c._count.tours === 0)
                .map((c) => (
                  <form key={c.id} action={deleteCategory.bind(null, c.id)}>
                    <ConfirmButton message={`Delete category ${c.name}?`}>Delete “{c.name}”</ConfirmButton>
                  </form>
                ))}
            </div>
          </div>
        </Card>

        <div id="addons">
          <Card title="Add-ons (car hire, flights, upgrades, activities)">
            <div className="-mx-5 -mt-5 overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Used on</th>
                    <th>Active</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {addOns.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <details>
                          <summary className="cursor-pointer font-medium text-brand-700">{a.name}</summary>
                          <form action={saveAddOn} className="mt-3 grid gap-2 md:grid-cols-3">
                            <input type="hidden" name="id" value={a.id} />
                            <input name="name" defaultValue={a.name} className="input md:col-span-3" />
                            <EnumSelect name="type" values={ADDON_TYPES} defaultValue={a.type} />
                            <input name="price" type="number" step="0.01" defaultValue={toNum(a.price)} className="input" />
                            <EnumSelect name="currency" values={CURRENCIES} defaultValue={a.currency} />
                            <EnumSelect name="unit" values={UNITS} defaultValue={a.unit} className="input md:col-span-2" />
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" name="active" defaultChecked={a.active} /> Active
                            </label>
                            <textarea name="description" defaultValue={a.description ?? ""} rows={2} className="input md:col-span-3" />
                            <SubmitButton className="btn-primary btn-sm">Save</SubmitButton>
                          </form>
                        </details>
                      </td>
                      <td>{label(a.type)}</td>
                      <td className="whitespace-nowrap">
                        {money(a.price, a.currency)} <span className="text-xs text-stone-500">{unitLabel[a.unit]}</span>
                      </td>
                      <td>{a._count.tours} tours</td>
                      <td>{a.active ? "Yes" : "No"}</td>
                      <td>
                        <form action={deleteAddOn.bind(null, a.id)}>
                          <ConfirmButton message="Delete this add-on?">✕</ConfirmButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form action={saveAddOn} className="mt-5 grid items-end gap-3 rounded-lg bg-sand-100 p-3 md:grid-cols-6">
              <input name="name" required className="input md:col-span-2" placeholder="New add-on name" />
              <EnumSelect name="type" values={ADDON_TYPES} />
              <input name="price" type="number" step="0.01" required className="input" placeholder="Price" />
              <EnumSelect name="currency" values={CURRENCIES} defaultValue="USD" />
              <EnumSelect name="unit" values={UNITS} />
              <input name="description" className="input md:col-span-5" placeholder="Description" />
              <input type="hidden" name="active" value="on" />
              <SubmitButton className="btn-primary btn-sm">Add</SubmitButton>
            </form>
          </Card>
        </div>

        <div id="seasons">
          <Card title="Peak seasons (dates repeat every year; everything else is low season)">
            <div className="space-y-2">
              {seasons.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-2">
                  <form action={saveSeason} className="flex flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input name="name" defaultValue={s.name} className="input w-48" />
                    <input name="startDate" type="date" defaultValue={dateInput(s.startDate)} className="input w-40" />
                    <span>→</span>
                    <input name="endDate" type="date" defaultValue={dateInput(s.endDate)} className="input w-40" />
                    <input type="hidden" name="type" value="PEAK" />
                    <SubmitButton className="btn-outline btn-sm">Save</SubmitButton>
                    <span className="text-xs text-stone-400">
                      {date(s.startDate).slice(0, 6)} – {date(s.endDate).slice(0, 6)}
                    </span>
                  </form>
                  <form action={deleteSeason.bind(null, s.id)}>
                    <ConfirmButton message="Delete this season?">✕</ConfirmButton>
                  </form>
                </div>
              ))}
              <form action={saveSeason} className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-sand-100 p-3">
                <input name="name" required className="input w-48" placeholder="e.g. Christmas" />
                <input name="startDate" type="date" required className="input w-40" />
                <span>→</span>
                <input name="endDate" type="date" required className="input w-40" />
                <input type="hidden" name="type" value="PEAK" />
                <SubmitButton className="btn-primary btn-sm">Add peak season</SubmitButton>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
