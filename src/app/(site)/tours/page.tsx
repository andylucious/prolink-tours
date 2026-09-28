import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { TourCard } from "@/components/site/TourCard";
import { seatsLeft, seatsTakenByTour } from "@/lib/seats";

export const metadata: Metadata = { title: "Tours & Safari Packages" };

const KINDS = [
  ["TOUR", "Tours"],
  ["EVENT", "Events"],
  ["ROAD_TRIP", "Road trips"],
] as const;

export default async function ToursPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; days?: string; kind?: string }> }) {
  const { category, q, days, kind: kindParam } = await searchParams;
  const kind = KINDS.find(([k]) => k === kindParam)?.[0];
  const categories = await db.category.findMany({ orderBy: { sort: "asc" } });
  const maxDays = days === "short" ? { lte: 3 } : days === "medium" ? { gte: 4, lte: 7 } : days === "long" ? { gte: 8 } : undefined;

  const found = await db.tour.findMany({
    where: {
      published: true,
      ...(kind ? { kind } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { destination: { contains: q } }, { summary: { contains: q } }] } : {}),
      ...(maxDays ? { durationDays: maxDays } : {}),
    },
    // Only what TourCard renders — skips the large description/inclusions/exclusions text columns.
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      destination: true,
      durationDays: true,
      coverImage: true,
      priceFrom: true,
      currency: true,
      kind: true,
      capacity: true,
      eventDate: true,
      category: { select: { name: true } },
    },
    orderBy: [{ featured: "desc" }, { title: "asc" }],
  });
  const taken = await seatsTakenByTour();
  const tours = found.map((t) => ({ ...t, seatsLeft: seatsLeft(t.capacity, taken.get(t.id) ?? 0) }));

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { category, q, days, kind, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/tours?${s}` : "/tours";
  };
  const active = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Tours directory</p>
      <h1 className="mt-1 font-display text-4xl text-stone-900">{active ? active.name : "All tours & packages"}</h1>
      {active?.description && <p className="mt-2 max-w-2xl text-stone-600">{active.description}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={href({ kind: undefined })} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${!kind ? "bg-accent-500 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-accent-500"}`}>
          Everything
        </Link>
        {KINDS.map(([k, l]) => (
          <Link key={k} href={href({ kind: k })} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${kind === k ? "bg-accent-500 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-accent-500"}`}>
            {l}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link href={href({ category: undefined })} className={`rounded-full px-4 py-2 text-sm font-medium ${!category ? "bg-brand-700 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-brand-300"}`}>
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={href({ category: c.slug })}
              className={`rounded-full px-4 py-2 text-sm font-medium ${category === c.slug ? "bg-brand-700 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-brand-300"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <form className="flex gap-2" action="/tours">
          {category && <input type="hidden" name="category" value={category} />}
          <select name="days" defaultValue={days ?? ""} className="input w-36">
            <option value="">Any length</option>
            <option value="short">1–3 days</option>
            <option value="medium">4–7 days</option>
            <option value="long">8+ days</option>
          </select>
          <input name="q" defaultValue={q} placeholder="Search destination…" className="input w-48" />
          <button className="btn-primary">Filter</button>
        </form>
      </div>

      {tours.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((t) => (
            <TourCard key={t.id} tour={t} />
          ))}
        </div>
      ) : (
        <div className="mt-16 rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <p className="font-display text-xl">No tours match those filters.</p>
          <p className="mt-2 text-sm text-stone-600">
            Try another category, or{" "}
            <Link href="/inquire" className="font-semibold text-brand-700 underline">
              request a custom trip
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
