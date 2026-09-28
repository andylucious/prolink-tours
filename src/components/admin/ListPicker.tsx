"use client";

import { useState } from "react";

/**
 * A "one item per line" text box with one-click suggestion chips above it. Clicking a chip adds
 * or removes that line, so setting what's included (photoshoot, food, snacks…) is quick, and the
 * box is still fully editable for anything custom. Saves as plain lines, like before.
 */
export function ListPicker({ name, defaultValue, suggestions, rows = 8 }: { name: string; defaultValue: string; suggestions: string[]; rows?: number }) {
  const [text, setText] = useState(defaultValue);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const has = (s: string) => lines.some((l) => l.toLowerCase() === s.toLowerCase());

  // Built from the latest text (not the last render), so fast clicks never overwrite each other.
  const toggle = (s: string) =>
    setText((prev) => {
      const cur = prev.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const on = cur.some((l) => l.toLowerCase() === s.toLowerCase());
      return (on ? cur.filter((l) => l.toLowerCase() !== s.toLowerCase()) : [...cur, s]).join("\n");
    });

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              has(s) ? "border-brand-500 bg-brand-50 text-brand-800" : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
            }`}
          >
            {has(s) ? "✓ " : "+ "}
            {s}
          </button>
        ))}
      </div>
      <textarea name={name} rows={rows} value={text} onChange={(e) => setText(e.target.value)} className="input" />
    </div>
  );
}
