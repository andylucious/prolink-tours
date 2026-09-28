"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn-primary", pendingLabel = "Saving…" }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={className} aria-busy={pending}>
      {pending && <span className="spinner" />}
      {pending ? pendingLabel : children}
    </button>
  );
}

/** A submit button that asks for confirmation first (for deletes etc.). */
export function ConfirmButton({ children, message = "Are you sure?", className = "btn-danger btn-sm" }: { children: React.ReactNode; message?: string; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export type LineItem = {
  description: string;
  supplierId?: number | null;
  serviceDate?: string;
  quantity: number;
  unitCost?: number;
  unitPrice: number;
};

/** Editable line-item table; serialises rows to a hidden JSON input named `items`. */
export function LineItemsEditor({
  initial,
  suppliers,
  withCost = false,
  currency,
  discount: initialDiscount = 0,
  taxRate,
}: {
  initial: LineItem[];
  suppliers?: { id: number; name: string }[];
  withCost?: boolean;
  currency: string;
  discount?: number;
  taxRate?: number;
}) {
  const blank: LineItem = { description: "", supplierId: null, serviceDate: "", quantity: 1, unitCost: 0, unitPrice: 0 };
  const [rows, setRows] = useState<LineItem[]>(initial.length ? initial : [blank]);
  const [discount, setDiscount] = useState(initialDiscount);
  const [tax, setTax] = useState(taxRate ?? 0);
  const update = (i: number, patch: Partial<LineItem>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const subtotal = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0);
  const cost = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitCost) || 0), 0);
  const afterDiscount = subtotal - (Number(discount) || 0);
  const total = afterDiscount + (taxRate !== undefined ? (afterDiscount * (Number(tax) || 0)) / 100 : 0);
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <input type="hidden" name="items" value={JSON.stringify(rows.filter((r) => r.description.trim()))} />
      <div className="overflow-x-auto">
        <table className="table min-w-[780px]">
          <thead>
            <tr>
              <th>Description</th>
              {suppliers && <th>Supplier</th>}
              {suppliers && <th>Date</th>}
              <th>Qty</th>
              {withCost && <th>Unit cost</th>}
              <th>Unit price</th>
              <th className="text-right">Amount</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <input className="input min-w-[180px]" value={r.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="e.g. 2 nights full board" />
                </td>
                {suppliers && (
                  <td>
                    <select className="input min-w-[130px]" value={r.supplierId ?? ""} onChange={(e) => update(i, { supplierId: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">—</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                {suppliers && (
                  <td>
                    <input type="date" className="input w-36" value={r.serviceDate ?? ""} onChange={(e) => update(i, { serviceDate: e.target.value })} />
                  </td>
                )}
                <td>
                  <input type="number" step="0.01" className="input w-20" value={r.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
                </td>
                {withCost && (
                  <td>
                    <input type="number" step="0.01" className="input w-24" value={r.unitCost ?? 0} onChange={(e) => update(i, { unitCost: Number(e.target.value) })} />
                  </td>
                )}
                <td>
                  <input type="number" step="0.01" className="input w-24" value={r.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} />
                </td>
                <td className="whitespace-nowrap text-right font-medium">{fmt((Number(r.quantity) || 0) * (Number(r.unitPrice) || 0))}</td>
                <td>
                  <button type="button" className="text-stone-400 hover:text-red-600" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="Remove line">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
        <button type="button" className="btn-outline btn-sm" onClick={() => setRows((r) => [...r, blank])}>
          + Add line
        </button>
        <div className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Subtotal</span>
            <span>
              {currency} {fmt(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-stone-500">Discount</span>
            <input name="discount" type="number" step="0.01" className="input w-28 text-right" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
          </div>
          {taxRate !== undefined && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-stone-500">Tax %</span>
              <input name="taxRate" type="number" step="0.01" className="input w-28 text-right" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
            </div>
          )}
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold">
            <span>Total</span>
            <span>
              {currency} {fmt(total)}
            </span>
          </div>
          {withCost && (
            <div className="flex justify-between text-xs text-stone-500">
              <span>Supplier cost {fmt(cost)}</span>
              <span className={total - cost >= 0 ? "text-emerald-700" : "text-red-700"}>
                Margin {fmt(total - cost)} ({total ? Math.round(((total - cost) / total) * 100) : 0}%)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
