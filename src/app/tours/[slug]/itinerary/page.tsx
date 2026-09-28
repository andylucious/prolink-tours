import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { lines, money } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

// Printable itinerary sheet — lives outside the (site) group so it has no header/footer.
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = await db.tour.findUnique({ where: { slug: (await params).slug }, select: { title: true } });
  return { title: t ? `${t.title} — Itinerary` : "Itinerary" };
}

export default async function ItineraryPrint({ params }: Params) {
  const { slug } = await params;
  const [tour, s] = await Promise.all([
    db.tour.findFirst({ where: { slug, published: true }, include: { days: { orderBy: { dayNumber: "asc" } } } }),
    getSettings(),
  ]);
  if (!tour) notFound();

  return (
    <div className="mx-auto max-w-3xl bg-white px-8 py-10 text-stone-900 print:p-0">
      <div className="no-print mb-8 flex items-center justify-between rounded-xl bg-sand-100 p-4 text-sm">
        <span>Use “Save as PDF” in the print dialog to download.</span>
        <PrintButton auto />
      </div>

      <header className="flex items-start justify-between border-b-2 border-brand-700 pb-5">
        <div className="flex items-start gap-4">
          {s.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo} alt={s.companyName} className="h-12 w-auto max-w-[120px] object-contain" />
          )}
          <div>
            <p className="font-display text-2xl text-brand-800">{s.companyName}</p>
            <p className="text-xs text-stone-500">
              {s.phone} · {s.email} · {s.address}
            </p>
          </div>
        </div>
        <p className="text-right text-xs text-stone-500">Itinerary</p>
      </header>

      {tour.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tour.coverImage} alt="" className="mt-6 h-56 w-full rounded-xl object-cover" />
      )}
      <h1 className="mt-6 font-display text-3xl">{tour.title}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {tour.durationDays} days · {tour.destination} · From {money(tour.priceFrom, tour.currency)} per person
      </p>
      <p className="mt-4 text-sm leading-relaxed">{tour.description}</p>

      <h2 className="mt-8 font-display text-xl text-brand-800">Day by day</h2>
      <div className="mt-3 space-y-4">
        {tour.days.map((d) => (
          <div key={d.id} className="break-inside-avoid border-l-4 border-accent-400 pl-4">
            <p className="font-semibold">
              Day {d.dayNumber}: {d.title}
            </p>
            <p className="mt-1 text-sm text-stone-700">{d.description}</p>
            <p className="mt-1 text-xs text-stone-500">
              {d.accommodation && <>Overnight: {d.accommodation} · </>}
              {d.meals && <>Meals: {d.meals}</>}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 break-inside-avoid text-sm">
        <div>
          <h3 className="font-semibold text-brand-800">Included</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {lines(tour.inclusions).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-red-800">Excluded</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {lines(tour.exclusions).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-10 border-t pt-4 text-center text-xs text-stone-500">
        To book, contact us on {s.phone} (WhatsApp) or {s.email}.
      </p>
    </div>
  );
}
