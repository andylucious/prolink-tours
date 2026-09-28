"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createPublicBooking, type BookingFormState } from "@/app/actions/booking";
import { estimate, unitLabel, type Residency } from "@/lib/pricing";
import { money } from "@/lib/format";
import type { PricingData } from "@/lib/catalog";

type Tour = PricingData["tours"][number];

export function BookingForm({
  data,
  tour,
  loggedIn,
  onClose,
}: {
  data: PricingData;
  tour: Tour;
  loggedIn: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<BookingFormState, FormData>(createPublicBooking, null);
  // An event / road trip runs on one fixed date, so the date is preset and can't be changed.
  const fixedDate = tour.eventDate;
  const [startDate, setStartDate] = useState(fixedDate ?? "");
  const left = tour.seatsLeft; // null = no seat limit
  const [residency, setResidency] = useState<Residency>("NON_RESIDENT");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const availableAddOns = useMemo(() => data.addOns.filter((a) => tour.addOnIds.includes(a.id)), [tour, data.addOns]);

  const est = useMemo(
    () =>
      estimate({
        rates: tour.rates,
        seasons: data.seasons,
        addOns: availableAddOns.filter((a) => selected.includes(a.id)),
        startDate: startDate || null,
        residency,
        adults,
        children,
        days: tour.durationDays,
        usdToKes: data.usdToKes,
      }),
    [tour, availableAddOns, selected, startDate, residency, adults, children, data],
  );

  const today = new Date().toISOString().slice(0, 10);

  // Portalled to <body> so this fixed-position modal is never trapped inside an ancestor that
  // (now or later) sets a CSS transform — which would otherwise turn it into a containing block
  // and break the overlay's positioning.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="animate-page-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">Book now</p>
            <h2 className="font-display text-2xl">{tour.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-2xl leading-none text-stone-400 hover:text-stone-700" aria-label="Close">
            ×
          </button>
        </div>

        <form action={action} className="mt-5 space-y-5">
          <input type="hidden" name="tourId" value={tour.id} />
          {left != null && (
            <p className={`rounded-lg p-3 text-sm font-medium ${left === 0 ? "bg-red-50 text-red-700" : left <= 5 ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-800"}`}>
              {left === 0 ? "Sorry — this trip is fully booked." : `${left} seat${left === 1 ? "" : "s"} left`}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="bk-start">
                {fixedDate ? "Date" : "Start date *"}
              </label>
              {fixedDate ? (
                <p className="input bg-stone-50 font-medium">{new Date(fixedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</p>
              ) : (
                <input id="bk-start" type="date" name="startDate" required min={today} className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              )}
            </div>
            <div>
              <label className="label" htmlFor="bk-residency">
                Residency
              </label>
              <select id="bk-residency" name="residency" className="input" value={residency} onChange={(e) => setResidency(e.target.value as Residency)}>
                <option value="NON_RESIDENT">Non-resident</option>
                <option value="RESIDENT">East African resident</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="bk-adults">
                Adults
              </label>
              <input id="bk-adults" type="number" name="adults" min={1} max={left != null ? Math.max(1, left) : 60} className="input" value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
            </div>
            <div>
              <label className="label" htmlFor="bk-children">
                Children
              </label>
              <input id="bk-children" type="number" name="children" min={0} max={40} className="input" value={children} onChange={(e) => setChildren(Number(e.target.value))} />
            </div>
          </div>

          {availableAddOns.length > 0 && (
            <div>
              <p className="label mb-2">Add-ons</p>
              <div className="grid grid-cols-1 gap-2">
                {availableAddOns.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${selected.includes(a.id) ? "border-brand-500 bg-brand-50" : "border-stone-200"}`}>
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
          )}

          {!loggedIn && (
            <fieldset className="space-y-3 rounded-xl border border-sand-200 bg-sand-50 p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-brand-700">Create your account to track this booking</legend>
              <div className="grid grid-cols-2 gap-3">
                <input name="name" required placeholder="Full name" className="input col-span-2" autoComplete="name" />
                <input name="email" type="email" required placeholder="Email" className="input col-span-2" autoComplete="email" />
                <input name="password" type="password" required minLength={6} placeholder="Choose a password" className="input" autoComplete="new-password" />
                <input name="phone" placeholder="Phone (optional)" className="input" autoComplete="tel" />
              </div>
              <p className="text-xs text-stone-500">
                Already booked with us?{" "}
                <Link href={`/account/login?next=/tours/${tour.slug}`} className="font-semibold text-brand-700 underline">
                  Sign in
                </Link>{" "}
                first instead.
              </p>
            </fieldset>
          )}

          <div>
            <label className="label" htmlFor="bk-message">
              Anything else we should know?
            </label>
            <textarea id="bk-message" name="message" rows={2} className="input" />
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          <div className="rounded-xl bg-brand-50 p-4">
            <p className="text-xs text-stone-500">{est.season === "PEAK" ? "Peak" : "Low"} season</p>
            <ul className="mt-2 space-y-2 text-sm">
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
            <div className="mt-3 flex items-baseline justify-between border-t border-brand-100 pt-3">
              <span className="text-sm font-semibold text-brand-800">Estimated total</span>
              <span className="text-xl font-bold text-brand-700">{money(est.total, est.currency)}</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">Confirmed by our team before payment.</p>
          </div>

          {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

          {left != null && adults + children > left && left > 0 && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">You&apos;ve chosen {adults + children} travellers but only {left} seat{left === 1 ? " is" : "s are"} left.</p>
          )}

          <button disabled={pending || left === 0 || (left != null && adults + children > left)} className="btn-accent w-full py-3 text-base">
            {pending && <span className="spinner" />}
            {pending ? "Booking…" : "Confirm booking request"}
          </button>
          <p className="text-center text-xs text-stone-500">No payment is taken now — we&apos;ll confirm availability first.</p>
        </form>
      </div>
    </div>,
    document.body,
  );
}
