import { EnumSelect, Field } from "@/components/admin/ui";

export const SUPPLIER_TYPES = ["LODGE", "HOTEL", "CAMP", "TRANSPORT", "AIRLINE", "PARK", "GUIDE", "ACTIVITY", "OTHER"] as const;

type S = { name?: string; type?: string; contactName?: string | null; email?: string | null; phone?: string | null; location?: string | null; paymentInfo?: string | null; notes?: string | null; active?: boolean };

export function SupplierFields({ s = {} }: { s?: S }) {
  return (
    <div className="space-y-3">
      <Field label="Name *">
        <input name="name" required defaultValue={s.name ?? ""} className="input" />
      </Field>
      <Field label="Type">
        <EnumSelect name="type" values={SUPPLIER_TYPES} defaultValue={s.type ?? "LODGE"} />
      </Field>
      <Field label="Contact person">
        <input name="contactName" defaultValue={s.contactName ?? ""} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <input name="email" type="email" defaultValue={s.email ?? ""} className="input" />
        </Field>
        <Field label="Phone">
          <input name="phone" defaultValue={s.phone ?? ""} className="input" />
        </Field>
      </div>
      <Field label="Location">
        <input name="location" defaultValue={s.location ?? ""} className="input" />
      </Field>
      <Field label="Payment details (bank / M-Pesa)">
        <textarea name="paymentInfo" rows={2} defaultValue={s.paymentInfo ?? ""} className="input" />
      </Field>
      <Field label="Notes / contract rates">
        <textarea name="notes" rows={3} defaultValue={s.notes ?? ""} className="input" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={s.active ?? true} className="accent-brand-600" /> Active
      </label>
    </div>
  );
}
