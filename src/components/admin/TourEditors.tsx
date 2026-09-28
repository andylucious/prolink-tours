"use client";

import { useState } from "react";

type Day = { title: string; description: string; accommodation: string; meals: string };

export function DaysEditor({ initial }: { initial: Day[] }) {
  const blank: Day = { title: "", description: "", accommodation: "", meals: "" };
  const [days, setDays] = useState<Day[]>(initial.length ? initial : [blank]);
  const set = (i: number, patch: Partial<Day>) => setDays((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) =>
    setDays((d) => {
      const n = [...d];
      const j = i + dir;
      if (j < 0 || j >= n.length) return d;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  return (
    <div className="space-y-4">
      <input type="hidden" name="days" value={JSON.stringify(days)} />
      {days.map((d, i) => (
        <div key={i} className="rounded-xl border border-stone-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-brand-700">Day {i + 1}</p>
            <div className="flex gap-1">
              <button type="button" className="btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button type="button" className="btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === days.length - 1}>
                ↓
              </button>
              <button type="button" className="btn-danger btn-sm" onClick={() => setDays((x) => x.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <input className="input md:col-span-2" placeholder="Title, e.g. Nairobi → Maasai Mara" value={d.title} onChange={(e) => set(i, { title: e.target.value })} />
            <input className="input" placeholder="Overnight (lodge/camp)" value={d.accommodation} onChange={(e) => set(i, { accommodation: e.target.value })} />
            <input className="input" placeholder="Meals, e.g. B, L, D" value={d.meals} onChange={(e) => set(i, { meals: e.target.value })} />
            <textarea className="input md:col-span-4" rows={3} placeholder="What happens this day…" value={d.description} onChange={(e) => set(i, { description: e.target.value })} />
          </div>
        </div>
      ))}
      <button type="button" className="btn-outline" onClick={() => setDays((d) => [...d, blank])}>
        + Add day
      </button>
    </div>
  );
}

type Rate = { season: "PEAK" | "LOW"; residency: "RESIDENT" | "NON_RESIDENT"; minPax: number; maxPax: number; pricePerPerson: number; currency: string };
type Band = { minPax: number; maxPax: number };
const COMBOS = [
  { residency: "NON_RESIDENT", season: "LOW", label: "Non-resident · Low" },
  { residency: "NON_RESIDENT", season: "PEAK", label: "Non-resident · Peak" },
  { residency: "RESIDENT", season: "LOW", label: "Resident · Low" },
  { residency: "RESIDENT", season: "PEAK", label: "Resident · Peak" },
] as const;

/** Grid editor: rows are group-size bands, columns are residency × season. */
export function RatesEditor({ initial }: { initial: Rate[] }) {
  const initialBands: Band[] = initial.length
    ? [...new Map(initial.map((r) => [`${r.minPax}-${r.maxPax}`, { minPax: r.minPax, maxPax: r.maxPax }])).values()].sort((a, b) => a.minPax - b.minPax)
    : [
        { minPax: 1, maxPax: 1 },
        { minPax: 2, maxPax: 3 },
        { minPax: 4, maxPax: 6 },
        { minPax: 7, maxPax: 99 },
      ];
  const [bands, setBands] = useState<Band[]>(initialBands);
  const [currency, setCurrency] = useState({
    NON_RESIDENT: initial.find((r) => r.residency === "NON_RESIDENT")?.currency ?? "USD",
    RESIDENT: initial.find((r) => r.residency === "RESIDENT")?.currency ?? "KES",
  });
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const r of initial) m[`${r.residency}|${r.season}|${r.minPax}`] = r.pricePerPerson;
    return m;
  });

  const rates: Rate[] = bands.flatMap((b) =>
    COMBOS.map((c) => ({
      residency: c.residency,
      season: c.season,
      minPax: b.minPax,
      maxPax: b.maxPax,
      pricePerPerson: prices[`${c.residency}|${c.season}|${b.minPax}`] ?? 0,
      currency: currency[c.residency],
    })),
  );

  return (
    <div>
      <input type="hidden" name="rates" value={JSON.stringify(rates)} />
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          Non-resident currency
          <select className="input w-24" value={currency.NON_RESIDENT} onChange={(e) => setCurrency({ ...currency, NON_RESIDENT: e.target.value })}>
            {["USD", "EUR", "GBP", "KES"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Resident currency
          <select className="input w-24" value={currency.RESIDENT} onChange={(e) => setCurrency({ ...currency, RESIDENT: e.target.value })}>
            {["KES", "USD"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="table min-w-[760px]">
          <thead>
            <tr>
              <th>Group size (pax)</th>
              {COMBOS.map((c) => (
                <th key={c.label}>
                  {c.label} <span className="normal-case text-stone-400">({currency[c.residency]})</span>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {bands.map((b, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-1">
                    <input type="number" min={1} className="input w-16" value={b.minPax} onChange={(e) => setBands((x) => x.map((y, j) => (j === i ? { ...y, minPax: Number(e.target.value) } : y)))} />
                    –
                    <input type="number" min={1} className="input w-16" value={b.maxPax} onChange={(e) => setBands((x) => x.map((y, j) => (j === i ? { ...y, maxPax: Number(e.target.value) } : y)))} />
                  </div>
                </td>
                {COMBOS.map((c) => {
                  const k = `${c.residency}|${c.season}|${b.minPax}`;
                  return (
                    <td key={k}>
                      <input type="number" step="0.01" className="input" value={prices[k] ?? ""} onChange={(e) => setPrices({ ...prices, [k]: Number(e.target.value) })} />
                    </td>
                  );
                })}
                <td>
                  <button type="button" className="text-stone-400 hover:text-red-600" onClick={() => setBands((x) => x.filter((_, j) => j !== i))}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn-outline btn-sm mt-3" onClick={() => setBands((x) => [...x, { minPax: (x.at(-1)?.maxPax ?? 0) + 1, maxPax: 99 }])}>
        + Add group-size band
      </button>
      <p className="mt-3 text-xs text-stone-500">Prices are per person. Leave a cell empty to hide that rate. Children pay 50% of the adult rate automatically.</p>
    </div>
  );
}
