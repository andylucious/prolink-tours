"use client";

import { useActionState, useMemo, useState } from "react";
import { submitInquiry, type FormState } from "@/app/actions/public";
import { estimate, unitLabel, type Residency } from "@/lib/pricing";
import { money } from "@/lib/format";
import type { PricingData } from "@/lib/catalog";

const typeLabels: Record<string, string> = {
  CAR_HIRE: "Car hire",
  FLIGHT: "Flights",
  ACCOMMODATION_UPGRADE: "Accommodation upgrades",
  ACTIVITY: "Activities",
  OTHER: "Other",
};

export function InquiryForm({ data, defaultSlug }: { data: PricingData; defaultSlug?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitInquiry, null);
  const [tourId, setTourId] = useState<number>(data.tours.find((t) => t.slug === defaultSlug)?.id ?? 0);
  const [startDate, setStartDate] = useState("");
  const [residency, setResidency] = useState<Residency>("NON_RESIDENT");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);

  const tour = data.tours.find((t) => t.id === tourId);
  const availableAddOns = useMemo(() => (tour ? data.addOns.filter((a) => tour.addOnIds.includes(a.id)) : []), [tour, data.addOns]);

  const est = useMemo(() => {
    if (!tour) return null;
    return estimate({
      rates: tour.rates,
      seasons: data.seasons,
      addOns: availableAddOns.filter((a) => selected.includes(a.id)),
      startDate: startDate || null,
      residency,
      adults,
      children,
      days: tour.durationDays,
      usdToKes: data.usdToKes,
    });
  }, [tour, availableAddOns, selected, startDate, residency, adults, children, data]);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-10 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 font-display text-3xl text-brand-800">Thank you — inquiry received!</h2>
        <p className="mt-2 text-stone-700">
          Your reference is <strong>{state.ref}</strong>. We&apos;ll email you a tailored quote within 24 hours.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <fieldset className="card space-y-4 p-6">
          <legend className="px-1 font-display text-xl">Your trip</legend>
          <div>
            <label className="label" htmlFor="tourId">
              Tour
            </label>
            <select
              id="tourId"
              name="tourId"
              className="input"
              value={tourId}
              onChange={(e) => {
                setTourId(Number(e.target.value));
                setSelected([]);
              }}
            >
              <option value={0}>Custom trip — not sure yet</option>
              {data.tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="startDate">
                Start date
              </label>
              <input id="startDate" type="date" name="startDate" min={today} className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="endDate">
                End date <span className="normal-case text-stone-400">(optional)</span>
              </label>
              <input id="endDate" type="date" name="endDate" min={startDate || today} className="input" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="adults">
                Adults
              </label>
              <input id="adults" type="number" name="adults" min={1} max={60} className="input" value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
            </div>
            <div>
              <label className="label" htmlFor="children">
                Children (under 12)
              </label>
              <input id="children" type="number" name="children" min={0} max={40} className="input" value={children} onChange={(e) => setChildren(Number(e.target.value))} />
            </div>
            <div>
              <label className="label" htmlFor="residency">
                Residency
              </label>
              <select id="residency" name="residency" className="input" value={residency} onChange={(e) => setResidency(e.target.value as Residency)}>
                <option value="NON_RESIDENT">Non-resident</option>
                <option value="RESIDENT">East African resident</option>
              </select>
            </div>
          </div>
        </fieldset>

        {availableAddOns.length > 0 && (
          <fieldset className="card p-6">
            <legend className="px-1 font-display text-xl">Optional add-ons</legend>
            <div className="mt-2 space-y-5">
              {Object.entries(typeLabels).map(([type, title]) => {
                const list = availableAddOns.filter((a) => a.type === type);
                if (!list.length) return null;
                return (
                  <div key={type}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-600">{title}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {list.map((a) => (
                        <label
                          key={a.id}
                          className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${
                            selected.includes(a.id) ? "border-brand-500 bg-brand-50" : "border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="addOns"
                            value={a.id}
                            className="mt-1 accent-brand-600"
                            checked={selected.includes(a.id)}
                            onChange={(e) => setSelected((s) => (e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id)))}
                          />
                          <span>
                            <span className="block font-semibold">{a.name}</span>
                            <span className="text-stone-500">
                              +{money(a.price, a.currency)} {unitLabel[a.unit]}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset className="card space-y-4 p-6">
          <legend className="px-1 font-display text-xl">Your details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Full name *
              </label>
              <input id="name" name="name" required className="input" autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email *
              </label>
              <input id="email" type="email" name="email" required className="input" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Phone / WhatsApp
              </label>
              <input id="phone" name="phone" className="input" autoComplete="tel" />
            </div>
            <div>
              <label className="label" htmlFor="country">
                Country
              </label>
              <input id="country" name="country" className="input" autoComplete="country-name" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="message">
              Anything else we should know?
            </label>
            <textarea id="message" name="message" rows={4} className="input" placeholder="Special occasions, preferred lodges, dietary needs…" />
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <p className="font-display text-xl">Trip estimate</p>
          {est && tour ? (
            <>
              <p className="mt-1 text-xs text-stone-500">
                {tour.title} · {est.season === "PEAK" ? "Peak" : "Low"} season
                {!startDate && " (pick a date for exact season)"}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {est.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="text-stone-600">
                      {l.label}
                      {l.detail && <span className="block text-xs text-stone-400">{l.detail}</span>}
                    </span>
                    <span className="shrink-0 font-medium">{money(l.amount, est.currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-baseline justify-between border-t border-stone-200 pt-4">
                <span className="text-sm font-semibold">Estimated total</span>
                <span className="text-2xl font-bold text-brand-700">{money(est.total, est.currency)}</span>
              </div>
              <p className="mt-2 text-xs text-stone-400">Indicative only — your final quote may vary with availability.</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-stone-600">Choose a tour to see an instant estimate, or send us your custom trip idea.</p>
          )}
          {state?.error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
          <button disabled={pending} className="btn-accent mt-6 w-full py-3 text-base">
            {pending && <span className="spinner" />}
            {pending ? "Sending…" : "Send inquiry"}
          </button>
          <p className="mt-3 text-center text-xs text-stone-500">No payment required.</p>
        </div>
      </aside>
    </form>
  );
}
