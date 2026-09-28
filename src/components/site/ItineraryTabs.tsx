"use client";

import { useState } from "react";

type Day = { id: number; dayNumber: number; title: string; description: string; accommodation: string | null; meals: string | null };

export function ItineraryTabs({ days }: { days: Day[] }) {
  const [active, setActive] = useState(0);
  const day = days[active];
  if (!day) return null;
  return (
    <div>
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-2">
        {days.map((d, i) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              i === active ? "bg-brand-700 text-white" : "bg-sand-100 text-stone-700 hover:bg-sand-200"
            }`}
          >
            Day {d.dayNumber}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-4 rounded-2xl border border-sand-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">Day {day.dayNumber}</p>
        <h3 className="mt-1 font-display text-2xl">{day.title}</h3>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">{day.description}</p>
        <div className="mt-5 flex flex-wrap gap-6 border-t border-sand-100 pt-4 text-sm">
          {day.accommodation && (
            <p>
              <span className="text-stone-500">Overnight: </span>
              <span className="font-semibold">{day.accommodation}</span>
            </p>
          )}
          {day.meals && (
            <p>
              <span className="text-stone-500">Meals: </span>
              <span className="font-semibold">{day.meals}</span>
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-between">
          <button disabled={active === 0} onClick={() => setActive(active - 1)} className="btn-outline btn-sm">
            ← Previous day
          </button>
          <button disabled={active === days.length - 1} onClick={() => setActive(active + 1)} className="btn-outline btn-sm">
            Next day →
          </button>
        </div>
      </div>
    </div>
  );
}
