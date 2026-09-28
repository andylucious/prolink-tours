// Trip estimate engine — pure functions shared by the public inquiry form (client)
// and the admin (server). Inputs are plain JSON so they can cross the RSC boundary.

export type SeasonType = "PEAK" | "LOW";
export type Residency = "RESIDENT" | "NON_RESIDENT";
export type PriceUnit = "PER_PERSON" | "PER_GROUP" | "PER_DAY" | "PER_PERSON_PER_DAY";

export type RateInput = {
  season: SeasonType;
  residency: Residency;
  minPax: number;
  maxPax: number;
  pricePerPerson: number;
  currency: string;
};
export type SeasonInput = { type: SeasonType; startDate: string; endDate: string };
export type AddOnInput = { id: number; name: string; price: number; currency: string; unit: PriceUnit; description?: string | null };

/** Children pay this fraction of the adult per-person rate. */
export const CHILD_FACTOR = 0.5;

/** Convert between USD and KES (other currencies pass through unchanged). */
export function convert(amount: number, from: string, to: string, usdToKes: number) {
  if (from === to) return amount;
  if (from === "USD" && to === "KES") return amount * usdToKes;
  if (from === "KES" && to === "USD") return amount / usdToKes;
  return amount;
}

const monthDay = (d: Date) => (d.getUTCMonth() + 1) * 100 + d.getUTCDate();

/** Seasons recur every year, so only month/day are compared. */
export function seasonFor(date: string | Date | null | undefined, seasons: SeasonInput[]): SeasonType {
  if (!date) return "LOW";
  const md = monthDay(new Date(date));
  for (const s of seasons) {
    if (s.type !== "PEAK") continue;
    const a = monthDay(new Date(s.startDate));
    const b = monthDay(new Date(s.endDate));
    const inside = a <= b ? md >= a && md <= b : md >= a || md <= b; // handles Dec→Jan wrap
    if (inside) return "PEAK";
  }
  return "LOW";
}

export function pickRate(rates: RateInput[], season: SeasonType, residency: Residency, pax: number) {
  const candidates = rates.filter((r) => r.season === season && r.residency === residency);
  const pool = candidates.length ? candidates : rates.filter((r) => r.residency === residency);
  if (!pool.length) return null;
  return (
    pool.find((r) => pax >= r.minPax && pax <= r.maxPax) ??
    // Outside every band: use the closest one.
    [...pool].sort((x, y) => Math.abs(x.minPax - pax) - Math.abs(y.minPax - pax))[0]
  );
}

// `detail` carries the add-on's own description (e.g. "BMW 3-series, 4 seats, includes driver
// and fuel") so specifics an admin types into an add-on show up wherever the estimate is
// rendered — the public estimate, the inquiry's saved breakdown, and quotes built from it.
export type EstimateLine = { label: string; amount: number; detail?: string | null };
export type Estimate = {
  season: SeasonType;
  currency: string;
  rate: RateInput | null;
  lines: EstimateLine[];
  total: number;
};

export function estimate(opts: {
  rates: RateInput[];
  seasons: SeasonInput[];
  addOns: AddOnInput[]; // only the selected ones
  startDate?: string | null;
  residency: Residency;
  adults: number;
  children: number;
  days: number;
  usdToKes: number;
}): Estimate {
  const adults = Math.max(0, opts.adults || 0);
  const children = Math.max(0, opts.children || 0);
  const pax = Math.max(1, adults + children);
  const season = seasonFor(opts.startDate, opts.seasons);
  const rate = pickRate(opts.rates, season, opts.residency, pax);
  const currency = rate?.currency ?? (opts.residency === "RESIDENT" ? "KES" : "USD");
  const lines: EstimateLine[] = [];

  if (rate) {
    if (adults) lines.push({ label: `${adults} adult${adults > 1 ? "s" : ""} × ${rate.pricePerPerson.toLocaleString()}`, amount: adults * rate.pricePerPerson });
    if (children)
      lines.push({
        label: `${children} child${children > 1 ? "ren" : ""} × ${(rate.pricePerPerson * CHILD_FACTOR).toLocaleString()}`,
        amount: children * rate.pricePerPerson * CHILD_FACTOR,
      });
  }

  for (const a of opts.addOns) {
    const qty =
      a.unit === "PER_PERSON" ? pax : a.unit === "PER_DAY" ? opts.days : a.unit === "PER_PERSON_PER_DAY" ? pax * opts.days : 1;
    // Spell out the quantity so a line reads like "Car hire (BMW, 4 seats) — 10 days × 90",
    // not just a lump sum with no breakdown of how it was worked out.
    const rateTxt = a.price.toLocaleString();
    const qtyTxt =
      a.unit === "PER_PERSON"
        ? `${pax} ${pax === 1 ? "person" : "people"} × ${rateTxt}`
        : a.unit === "PER_DAY"
          ? `${opts.days} ${opts.days === 1 ? "day" : "days"} × ${rateTxt}`
          : a.unit === "PER_PERSON_PER_DAY"
            ? `${pax} × ${opts.days} ${opts.days === 1 ? "night" : "nights"} × ${rateTxt}`
            : rateTxt; // PER_GROUP: a single flat price, no multiplier to show
    lines.push({ label: `${a.name} — ${qtyTxt}`, amount: convert(a.price * qty, a.currency, currency, opts.usdToKes), detail: a.description });
  }

  const total = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  return { season, currency, rate, lines, total };
}

export const unitLabel: Record<PriceUnit, string> = {
  PER_PERSON: "per person",
  PER_GROUP: "per group",
  PER_DAY: "per day",
  PER_PERSON_PER_DAY: "per person / day",
};
