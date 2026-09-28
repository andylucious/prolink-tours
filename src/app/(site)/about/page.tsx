import Link from "next/link";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "About Us" };

export default async function AboutPage() {
  const [s, tourCount, cover] = await Promise.all([
    getSettings(),
    db.tour.count({ where: { published: true } }),
    db.tour.findFirst({ where: { published: true, coverImage: { not: null } }, orderBy: { featured: "desc" }, select: { coverImage: true } }),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">About us</p>
          <h1 className="mt-1 font-display text-4xl leading-tight">Local people, big adventures.</h1>
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-stone-700">{s.aboutText}</p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              [`${tourCount}+`, "Signature tours"],
              ["24h", "Quote turnaround"],
              ["100%", "Tailor-made"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-sand-100 p-4">
                <p className="font-display text-3xl text-brand-700">{n}</p>
                <p className="text-xs text-stone-600">{l}</p>
              </div>
            ))}
          </div>
        </div>
        {cover?.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.coverImage} alt="" className="aspect-[4/5] w-full rounded-3xl object-cover" />
        )}
      </div>
      <section className="mt-20 grid gap-6 md:grid-cols-3">
        {[
          ["Experienced guides", "Our driver-guides are KPSGA-certified with years in the field, fluent in wildlife and local culture."],
          ["Responsible travel", "We work with community conservancies and locally owned camps so your trip supports the places you visit."],
          ["Support start to finish", "One team from the first inquiry to your return flight — reachable 24/7 on WhatsApp while you travel."],
        ].map(([t, d]) => (
          <div key={t} className="card p-6">
            <p className="font-display text-xl text-brand-800">{t}</p>
            <p className="mt-2 text-sm text-stone-600">{d}</p>
          </div>
        ))}
      </section>
      <div className="mt-16 text-center">
        <Link href="/tours" className="btn-primary px-6 py-3 text-base">
          Browse our tours
        </Link>
      </div>
    </div>
  );
}
