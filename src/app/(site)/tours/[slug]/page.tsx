import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { lines, money, toNum } from "@/lib/format";
import { CHILD_FACTOR, unitLabel } from "@/lib/pricing";
import { ItineraryTabs } from "@/components/site/ItineraryTabs";
import { Gallery } from "@/components/site/Gallery";
import { BookNowButton } from "@/components/site/BookNowButton";
import { getSettings } from "@/lib/settings";
import { getPricingData } from "@/lib/catalog";
import { getCustomerSession } from "@/lib/customer-auth";

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return db.tour.findFirst({
    where: { slug, published: true },
    include: {
      category: true,
      days: { orderBy: { dayNumber: "asc" } },
      images: { orderBy: { sort: "asc" } },
      rates: { orderBy: [{ residency: "asc" }, { season: "asc" }, { minPax: "asc" }] },
      addOns: { where: { active: true }, orderBy: [{ type: "asc" }, { name: "asc" }] },
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tour = await load((await params).slug);
  return tour ? { title: tour.title, description: tour.summary, openGraph: { images: tour.coverImage ? [tour.coverImage] : [] } } : {};
}

const addOnGroups = [
  ["CAR_HIRE", "Car hire"],
  ["FLIGHT", "Flight connections"],
  ["ACCOMMODATION_UPGRADE", "Hotel & lodge upgrades"],
  ["ACTIVITY", "Activities"],
  ["OTHER", "Other extras"],
] as const;

export default async function TourPage({ params }: Params) {
  const { slug } = await params;
  const [tour, seasons, s, pricing, customerSession] = await Promise.all([
    load(slug),
    db.season.findMany({ where: { type: "PEAK" } }),
    getSettings(),
    getPricingData(),
    getCustomerSession(),
  ]);
  if (!tour) notFound();
  const pricingTour = pricing.tours.find((t) => t.id === tour.id);

  const bands = [...new Map(tour.rates.map((r) => [`${r.minPax}-${r.maxPax}`, r])).values()]
    .map((r) => ({ min: r.minPax, max: r.maxPax }))
    .sort((a, b) => a.min - b.min);
  const rateFor = (residency: string, season: string, min: number) =>
    tour.rates.find((r) => r.residency === residency && r.season === season && r.minPax === min);
  const monthDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <article>
      {/* Hero */}
      <section className="relative isolate">
        {tour.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tour.coverImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-40 sm:px-6">
          <Link href={`/tours?category=${tour.category.slug}`} className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-800">
            {tour.category.name}
          </Link>
          <h1 className="mt-4 max-w-3xl font-display text-4xl text-white md:text-5xl">{tour.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/85">{tour.summary}</p>
          <div className="mt-5 flex flex-wrap gap-6 text-sm text-white">
            <span>🗓 {tour.durationDays} {tour.durationDays === 1 ? "day" : "days"}</span>
            <span>📍 {tour.destination}</span>
            <span>
              From <strong className="text-accent-400">{money(tour.priceFrom, tour.currency)}</strong> pp
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-3">
        <div className="space-y-14 lg:col-span-2">
          <section>
            <h2 className="font-display text-3xl">Overview</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-stone-700">{tour.description}</p>
          </section>

          {tour.days.length > 0 && (
            <section>
              <h2 className="mb-5 font-display text-3xl">Day-by-day itinerary</h2>
              <ItineraryTabs days={tour.days} />
            </section>
          )}

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
              <h3 className="font-display text-xl text-brand-800">What&apos;s included</h3>
              <ul className="mt-4 space-y-2.5">
                {lines(tour.inclusions).map((l) => (
                  <li key={l} className="flex gap-3 text-sm text-stone-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-xs text-white">✓</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-6">
              <h3 className="font-display text-xl text-red-900">Not included</h3>
              <ul className="mt-4 space-y-2.5">
                {lines(tour.exclusions).map((l) => (
                  <li key={l} className="flex gap-3 text-sm text-stone-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-400 text-xs text-white">✕</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {tour.images.length > 0 && (
            <section>
              <h2 className="mb-5 font-display text-3xl">Photo gallery</h2>
              <Gallery images={tour.images} />
            </section>
          )}

          {tour.rates.length > 0 && (
            <section>
              <h2 className="font-display text-3xl">Pricing guide</h2>
              <p className="mt-2 text-sm text-stone-600">
                Price per person, sharing. Costs depend on group size, travel season and residency. Children under 12 pay{" "}
                {CHILD_FACTOR * 100}% of the adult rate.
              </p>
              {seasons.length > 0 && (
                <p className="mt-2 text-sm text-stone-600">
                  <strong>Peak season:</strong> {seasons.map((x) => `${x.name} (${monthDay(x.startDate)} – ${monthDay(x.endDate)})`).join(", ")}. All other dates are low season.
                </p>
              )}
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {(["NON_RESIDENT", "RESIDENT"] as const).map((res) => {
                  const any = tour.rates.some((r) => r.residency === res);
                  if (!any) return null;
                  return (
                    <div key={res} className="overflow-hidden rounded-2xl border border-sand-200 bg-white">
                      <p className="bg-sand-100 px-4 py-3 text-sm font-semibold">{res === "RESIDENT" ? "East African residents" : "Non-residents"}</p>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase text-stone-500">
                            <th className="px-4 py-2">Group size</th>
                            <th className="px-4 py-2 text-right">Low season</th>
                            <th className="px-4 py-2 text-right">Peak season</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bands.map((b) => {
                            const low = rateFor(res, "LOW", b.min);
                            const peak = rateFor(res, "PEAK", b.min);
                            return (
                              <tr key={b.min} className="border-t border-sand-100">
                                <td className="px-4 py-2.5">
                                  {b.min === b.max ? `${b.min} ${b.min === 1 ? "person" : "people"}` : b.max >= 99 ? `${b.min}+ people` : `${b.min}–${b.max} people`}
                                </td>
                                <td className="px-4 py-2.5 text-right font-medium">{low ? money(low.pricePerPerson, low.currency) : "—"}</td>
                                <td className="px-4 py-2.5 text-right font-medium">{peak ? money(peak.pricePerPerson, peak.currency) : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {tour.addOns.length > 0 && (
            <section>
              <h2 className="font-display text-3xl">Optional add-ons</h2>
              <p className="mt-2 text-sm text-stone-600">Customise your trip — these options adjust your overall estimate. Select them on the inquiry form.</p>
              <div className="mt-5 space-y-6">
                {addOnGroups.map(([type, title]) => {
                  const list = tour.addOns.filter((a) => a.type === type);
                  if (!list.length) return null;
                  return (
                    <div key={type}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-600">{title}</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {list.map((a) => (
                          <div key={a.id} className="rounded-xl border border-sand-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-semibold">{a.name}</p>
                              <p className="shrink-0 text-sm font-bold text-brand-700">+{money(a.price, a.currency)}</p>
                            </div>
                            <p className="text-xs text-stone-500">{unitLabel[a.unit]}</p>
                            {a.description && <p className="mt-2 text-sm text-stone-600">{a.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sticky booking panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-stone-500">From</p>
            <p className="text-3xl font-bold text-brand-700">{money(tour.priceFrom, tour.currency)}</p>
            <p className="text-xs text-stone-500">per person, sharing</p>
            {pricingTour && <BookNowButton data={pricing} tour={pricingTour} loggedIn={!!customerSession} className="btn-accent mt-6 w-full py-3 text-base" />}
            <Link href={`/inquire?tour=${tour.slug}`} className="btn-outline mt-3 w-full">
              Inquire / ask a question first
            </Link>
            <a href={`/tours/${tour.slug}/itinerary`} target="_blank" className="btn-outline mt-3 w-full">
              ⬇ Download itinerary (PDF)
            </a>
            <a
              href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I'm interested in the ${tour.title}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn mt-3 w-full bg-[#25D366] text-white hover:bg-[#1fb857]"
            >
              Ask on WhatsApp
            </a>
            <ul className="mt-6 space-y-2 border-t border-sand-100 pt-5 text-sm text-stone-600">
              <li>✓ No payment needed to inquire</li>
              <li>✓ Tailored quote within 24 hours</li>
              <li>✓ Resident & non-resident rates</li>
            </ul>
            {toNum(tour.priceFrom) > 0 && <p className="mt-4 text-xs text-stone-400">Final price confirmed on your quote.</p>}
          </div>
        </aside>
      </div>
    </article>
  );
}
