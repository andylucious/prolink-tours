import { toNum } from "./format";

type Item = { quantity: unknown; unitPrice: unknown; unitCost?: unknown };

export function quoteTotals(items: Item[], discount: unknown) {
  const subtotal = items.reduce((s, i) => s + toNum(i.quantity as number) * toNum(i.unitPrice as number), 0);
  const cost = items.reduce((s, i) => s + toNum(i.quantity as number) * toNum(i.unitCost as number), 0);
  const total = subtotal - toNum(discount as number);
  return { subtotal, cost, total, margin: total - cost };
}

export function invoiceTotals(
  inv: { items: Item[]; discount: unknown; taxRate: unknown; payments?: { amount: unknown }[] },
) {
  const subtotal = inv.items.reduce((s, i) => s + toNum(i.quantity as number) * toNum(i.unitPrice as number), 0);
  const afterDiscount = subtotal - toNum(inv.discount as number);
  const tax = (afterDiscount * toNum(inv.taxRate as number)) / 100;
  const total = Math.round((afterDiscount + tax) * 100) / 100;
  const paid = (inv.payments ?? []).reduce((s, p) => s + toNum(p.amount as number), 0);
  return { subtotal, tax, total, paid, balance: Math.round((total - paid) * 100) / 100 };
}
