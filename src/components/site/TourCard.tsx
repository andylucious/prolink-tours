import Link from "next/link";
import Image from "next/image";
import { money } from "@/lib/format";

type Props = {
  tour: {
    slug: string;
    title: string;
    summary: string;
    destination: string;
    durationDays: number;
    coverImage: string | null;
    priceFrom: unknown;
    currency: string;
    category: { name: string };
    kind?: string;
    eventDate?: Date | null;
    /** null / undefined = no seat limit */
    seatsLeft?: number | null;
  };
  priority?: boolean;
};

export function TourCard({ tour, priority = false }: Props) {
  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-200">
        {tour.coverImage && (
          <Image
            src={tour.coverImage}
            alt={tour.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-800">{tour.category.name}</span>
        {tour.kind && tour.kind !== "TOUR" && (
          <span className="absolute right-3 top-3 rounded-full bg-accent-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">{tour.kind === "EVENT" ? "Event" : "Road trip"}</span>
        )}
        {tour.seatsLeft != null && (
          <span className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-bold ${tour.seatsLeft === 0 ? "bg-red-600 text-white" : tour.seatsLeft <= 5 ? "bg-amber-400 text-stone-900" : "bg-white/90 text-brand-800"}`}>
            {tour.seatsLeft === 0 ? "Fully booked" : `${tour.seatsLeft} seat${tour.seatsLeft === 1 ? "" : "s"} left`}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          {tour.eventDate ? `${tour.eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · ` : ""}
          {tour.durationDays} {tour.durationDays === 1 ? "day" : "days"} · {tour.destination}
        </p>
        <h3 className="mt-1.5 font-display text-xl leading-snug text-stone-900 group-hover:text-brand-700">{tour.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-stone-600">{tour.summary}</p>
        <div className="mt-auto flex items-end justify-between pt-5">
          <p className="text-xs text-stone-500">
            From <span className="block text-lg font-bold text-brand-700">{money(tour.priceFrom as number, tour.currency)}</span>
          </p>
          <span className="text-sm font-semibold text-accent-600">View trip →</span>
        </div>
      </div>
    </Link>
  );
}
