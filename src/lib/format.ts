// Formatting helpers safe for both server and client components.

type Num = number | string | { toString(): string } | null | undefined;

export const toNum = (v: Num) => (v == null ? 0 : Number(v.toString()));

export function money(v: Num, currency = "USD") {
  const n = toNum(v);
  return `${currency} ${n.toLocaleString("en-US", {
    minimumFractionDigits: currency === "KES" ? 0 : 2,
    maximumFractionDigits: currency === "KES" ? 0 : 2,
  })}`;
}

export function date(v: Date | string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function dateInput(v: Date | string | null | undefined) {
  if (!v) return "";
  return new Date(v).toISOString().slice(0, 10);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const lines = (s: string | null | undefined) =>
  (s ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const CURRENCIES = ["USD", "KES", "EUR", "GBP"] as const;
