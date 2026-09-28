import "server-only";

/** Human-friendly document numbers like INV-2609-4F7K (year+month + random). */
export function docNumber(prefix: string) {
  const d = new Date();
  const ym = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ym}-${rand}`;
}
