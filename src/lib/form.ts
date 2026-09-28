// Small FormData readers for server actions.

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const opt = (fd: FormData, k: string) => str(fd, k) || null;
export const int = (fd: FormData, k: string, d = 0) => {
  const n = parseInt(str(fd, k), 10);
  return Number.isFinite(n) ? n : d;
};
export const dec = (fd: FormData, k: string, d = 0) => {
  const n = parseFloat(str(fd, k).replace(/,/g, ""));
  return Number.isFinite(n) ? n : d;
};
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
export const dateOrNull = (fd: FormData, k: string) => (str(fd, k) ? new Date(str(fd, k)) : null);
export const optInt = (fd: FormData, k: string) => (str(fd, k) ? int(fd, k) : null);

/** Parse the JSON produced by <LineItemsEditor>. */
export function items<T>(fd: FormData, k = "items"): T[] {
  try {
    const v = JSON.parse(str(fd, k) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
