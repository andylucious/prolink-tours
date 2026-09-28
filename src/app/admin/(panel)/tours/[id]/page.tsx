import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { addTourImages, deleteTour, deleteTourImage, saveTourDays, saveTourRates, setCoverFromImage, updateTour } from "@/app/actions/catalog";
import { toNum } from "@/lib/format";
import { Card, Field, PageHeader } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import { DaysEditor, RatesEditor } from "@/components/admin/TourEditors";
import { TourForm } from "../TourForm";

const TABS = [
  ["details", "Details"],
  ["itinerary", "Itinerary"],
  ["pricing", "Pricing"],
  ["photos", "Photos"],
] as const;

export default async function TourEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; saved?: string }> }) {
  const id = Number((await params).id);
  const { tab = "details", saved } = await searchParams;
  const tour = await db.tour.findUnique({
    where: { id },
    include: { addOns: { select: { id: true } }, days: { orderBy: { dayNumber: "asc" } }, rates: true, images: { orderBy: { sort: "asc" } } },
  });
  if (!tour) notFound();

  return (
    <>
      <PageHeader
        title={tour.title}
        back={{ href: "/admin/tours", label: "Tours" }}
        actions={
          <a href={`/tours/${tour.slug}`} target="_blank" className="btn-outline">
            View on website ↗
          </a>
        }
      />
      <div className="mb-6 flex gap-1 border-b border-stone-200">
        {TABS.map(([k, l]) => (
          <Link
            key={k}
            href={`/admin/tours/${id}?tab=${k}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === k ? "border-brand-600 text-brand-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            {l}
          </Link>
        ))}
      </div>
      {saved && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Saved — the website is updated.</p>}

      {tab === "details" && (
        <>
          <TourForm action={updateTour.bind(null, id)} tour={tour} submitLabel="Save tour" />
          <form action={deleteTour.bind(null, id)} className="mt-8">
            <ConfirmButton message="Delete this tour? Inquiries and bookings keep their records but lose the link.">Delete tour</ConfirmButton>
          </form>
        </>
      )}

      {tab === "itinerary" && (
        <form action={saveTourDays.bind(null, id)}>
          <Card title="Day-by-day schedule">
            <DaysEditor initial={tour.days.map((d) => ({ title: d.title, description: d.description, accommodation: d.accommodation ?? "", meals: d.meals ?? "" }))} />
          </Card>
          <div className="mt-4">
            <SubmitButton>Save itinerary</SubmitButton>
          </div>
        </form>
      )}

      {tab === "pricing" && (
        <form action={saveTourRates.bind(null, id)}>
          <Card title="Rate card — price per person">
            <RatesEditor
              initial={tour.rates.map((r) => ({ season: r.season, residency: r.residency, minPax: r.minPax, maxPax: r.maxPax, pricePerPerson: toNum(r.pricePerPerson), currency: r.currency }))}
            />
          </Card>
          <div className="mt-4 flex items-center gap-4">
            <SubmitButton>Save rates</SubmitButton>
            <Link href="/admin/catalog#seasons" className="text-sm text-brand-700 hover:underline">
              Edit peak season dates →
            </Link>
          </div>
        </form>
      )}

      {tab === "photos" && (
        <div className="space-y-6">
          <Card title="Add photos">
            <form action={addTourImages.bind(null, id)} className="grid gap-4 md:grid-cols-4">
              <Field label="Upload images (multiple allowed)" className="md:col-span-2">
                <input name="files" type="file" accept="image/*" multiple className="input" />
              </Field>
              <Field label="…or image URL">
                <input name="url" className="input" />
              </Field>
              <Field label="Caption">
                <input name="caption" className="input" />
              </Field>
              <div>
                <SubmitButton>Upload</SubmitButton>
              </div>
            </form>
          </Card>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {tour.images.map((img) => (
              <div key={img.id} className="card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-[4/3] w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-2">
                  {tour.coverImage === img.url ? (
                    <span className="text-xs font-semibold text-emerald-700">Cover</span>
                  ) : (
                    <form action={setCoverFromImage.bind(null, img.id)}>
                      <button className="btn-outline btn-sm">Make cover</button>
                    </form>
                  )}
                  <form action={deleteTourImage.bind(null, img.id)}>
                    <ConfirmButton message="Remove this photo?">Remove</ConfirmButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
