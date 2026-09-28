import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { TourCard } from "@/components/site/TourCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Trimmed to the columns each section actually renders — these big TEXT fields
  // (description, inclusions, itinerary content…) don't need to cross the wire for a card grid.
  const [s, featured, categories, posts] = await Promise.all([
    getSettings(),
    db.tour.findMany({
      where: { published: true, featured: true },
      select: { id: true, slug: true, title: true, summary: true, destination: true, durationDays: true, coverImage: true, priceFrom: true, currency: true, category: { select: { name: true } } },
      take: 6,
      orderBy: { createdAt: "asc" },
    }),
    db.category.findMany({
      orderBy: { sort: "asc" },
      select: { id: true, name: true, slug: true, image: true, _count: { select: { tours: { where: { published: true } } } } },
    }),
    db.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 3, select: { id: true, slug: true, title: true, excerpt: true, coverImage: true } }),
  ]);
  const hero = featured[0]?.coverImage ?? categories[0]?.image;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        {hero && <Image src={hero} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-900/90 via-brand-900/60 to-brand-900/10" />
        <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 md:py-40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-400">Kenya · Tanzania · East Africa</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-white md:text-6xl">
            Journeys into the wild, crafted around you.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-brand-100">{s.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tours" className="btn-accent px-6 py-3 text-base">
              Explore packages
            </Link>
            <Link href="/inquire" className="btn border border-white/60 px-6 py-3 text-base text-white hover:bg-white/10">
              Request a custom quote
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.id} href={`/tours?category=${c.slug}`} className="group relative isolate flex h-44 items-end overflow-hidden rounded-2xl p-5 transition-transform duration-200 active:scale-[0.97]">
              {c.image && (
                <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="-z-10 object-cover transition duration-500 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 to-black/5" />
              <div>
                <p className="font-display text-xl text-white">{c.name}</p>
                <p className="text-xs text-white/80">{c._count.tours} packages</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Best-selling tours</p>
            <h2 className="mt-1 font-display text-3xl text-stone-900 md:text-4xl">Our travellers&apos; favourites</h2>
          </div>
          <Link href="/tours" className="hidden text-sm font-semibold text-brand-700 hover:underline sm:block">
            View all tours →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TourCard key={t.id} tour={t} />
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 rounded-3xl bg-sand-100 p-8 md:grid-cols-4 md:p-12">
          <div className="md:col-span-1">
            <h2 className="font-display text-3xl text-stone-900">Why travel with us</h2>
          </div>
          {[
            ["Local experts", "Kenyan-owned team with guides who know every corner of the parks."],
            ["Transparent pricing", "Clear inclusions, resident & non-resident rates, no hidden extras."],
            ["Tailor-made", "Every itinerary can be adjusted — dates, lodges, vehicles and flights."],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-semibold text-brand-800">{t}</p>
              <p className="mt-1 text-sm text-stone-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl text-stone-900">Travel guides & safari tips</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sand-200">
                  {p.coverImage && (
                    <Image src={p.coverImage} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition group-hover:scale-105" />
                  )}
                </div>
                <p className="mt-4 font-display text-xl group-hover:text-brand-700">{p.title}</p>
                <p className="mt-1 text-sm text-stone-600">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand-800 p-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl text-white">Have a trip in mind?</h2>
            <p className="mt-2 text-brand-100">Tell us your dates and group size — we&apos;ll send a tailored quote within 24 hours.</p>
          </div>
          <Link href="/inquire" className="btn-accent px-6 py-3 text-base">
            Plan my trip
          </Link>
        </div>
      </section>
    </>
  );
}
