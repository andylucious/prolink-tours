import "server-only";
import { db } from "./db";
import { getSettings } from "./settings";
import { toNum } from "./format";
import type { AddOnInput, RateInput, SeasonInput } from "./pricing";

/** Plain-JSON pricing data for the inquiry form / estimator. */
export async function getPricingData() {
  const [tours, seasons, allAddOns, s] = await Promise.all([
    db.tour.findMany({
      where: { published: true },
      orderBy: { title: "asc" },
      include: { rates: true, addOns: { where: { active: true } } },
    }),
    db.season.findMany(),
    db.addOn.findMany({ where: { active: true }, orderBy: [{ type: "asc" }, { name: "asc" }] }),
    getSettings(),
  ]);

  const mapAddOn = (a: (typeof allAddOns)[number]): AddOnInput & { type: string; description: string | null } => ({
    id: a.id,
    name: a.name,
    price: toNum(a.price),
    currency: a.currency,
    unit: a.unit,
    type: a.type,
    description: a.description,
  });

  return {
    usdToKes: Number(s.usdToKes) || 129,
    seasons: seasons.map<SeasonInput>((x) => ({ type: x.type, startDate: x.startDate.toISOString(), endDate: x.endDate.toISOString() })),
    addOns: allAddOns.map(mapAddOn),
    tours: tours.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      durationDays: t.durationDays,
      addOnIds: t.addOns.map((a) => a.id),
      rates: t.rates.map<RateInput>((r) => ({
        season: r.season,
        residency: r.residency,
        minPax: r.minPax,
        maxPax: r.maxPax,
        pricePerPerson: toNum(r.pricePerPerson),
        currency: r.currency,
      })),
    })),
  };
}

export type PricingData = Awaited<ReturnType<typeof getPricingData>>;
