import { requireAdmin } from "@/lib/auth";
import { getSettings, type Settings } from "@/lib/settings";
import { saveSettings } from "@/app/actions/system";
import { Card, Field, PageHeader } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";

export const metadata = { title: "Settings" };

const groups: { title: string; fields: [keyof Settings, string, "text" | "area"][] }[] = [
  {
    title: "Company & website",
    fields: [
      ["companyName", "Company name", "text"],
      ["tagline", "Tagline (home page & Google)", "text"],
      ["aboutText", "About us text", "area"],
      ["facebook", "Facebook URL", "text"],
      ["instagram", "Instagram URL", "text"],
    ],
  },
  // "logo" is rendered by hand below (file upload + URL fallback), not through this table.
  {
    title: "Contact",
    fields: [
      ["phone", "Phone", "text"],
      ["whatsapp", "WhatsApp number (digits, with country code e.g. 254712345678)", "text"],
      ["email", "Public email", "text"],
      ["notifyEmail", "Send new-inquiry alerts to (defaults to public email)", "text"],
      ["address", "Office address", "text"],
    ],
  },
  {
    title: "Money & documents",
    fields: [
      ["usdToKes", "Exchange rate: 1 USD = ? KES (used for add-on conversions)", "text"],
      ["invoiceTerms", "Payment terms (quotes & invoices)", "area"],
      ["bankDetails", "Bank details", "area"],
      ["mpesaDetails", "M-Pesa details", "area"],
    ],
  },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const [s, { saved }] = await Promise.all([getSettings(), searchParams]);
  return (
    <>
      <PageHeader title="Settings" />
      {saved && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Settings saved.</p>}
      <form action={saveSettings} className="space-y-6">
        <Card title="Logo">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <span className="label">Current logo</span>
              <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-dashed border-stone-300 bg-sand-50">
                {s.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logo} alt="Company logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-stone-400">No logo set</span>
                )}
              </div>
            </div>
            <Field label="Upload a new logo">
              <input name="logoFile" type="file" accept="image/*" className="input" />
              <p className="mt-1 text-xs text-stone-500">PNG with a transparent background works best. Shown on quotes, invoices, bookings and printed reports.</p>
            </Field>
            <Field label="…or paste an image URL">
              <input name="logo" defaultValue={s.logo} className="input" />
            </Field>
          </div>
        </Card>
        {groups.map((g) => (
          <Card key={g.title} title={g.title}>
            <div className="grid gap-4 md:grid-cols-2">
              {g.fields.map(([k, l, type]) => (
                <Field key={k} label={l} className={type === "area" ? "md:col-span-2" : ""}>
                  {type === "area" ? <textarea name={k} rows={3} defaultValue={s[k]} className="input" /> : <input name={k} defaultValue={s[k]} className="input" />}
                </Field>
              ))}
            </div>
          </Card>
        ))}
        <SubmitButton>Save settings</SubmitButton>
      </form>
    </>
  );
}
