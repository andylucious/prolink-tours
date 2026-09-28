"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Desktop-style report/document viewer chrome: a toolbar (print, refresh, zoom, close) above
 * the paper preview, and a status bar below it showing page and zoom info — wraps quotes,
 * invoices, vouchers, bookings and the printable report so they all feel like one consistent
 * "viewer" instead of a plain web page. Print always renders at 100%; the zoom only affects
 * on-screen preview.
 */
export function DocumentViewer({ children, closeHref = "/admin" }: { children: React.ReactNode; closeHref?: string }) {
  const [zoom, setZoom] = useState(100);
  const step = (d: number) => setZoom((z) => Math.min(150, Math.max(50, z + d)));

  return (
    <div className="min-h-screen bg-stone-200 print:bg-white">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-stone-300 bg-stone-100 px-3 py-2 shadow-sm">
        <button onClick={() => window.print()} title="Print / Save as PDF" className="toolbar-btn">
          🖨 <span className="hidden sm:inline">Print / PDF</span>
        </button>
        <button onClick={() => window.location.reload()} title="Refresh" className="toolbar-btn">
          ↻
        </button>
        <span className="mx-1 h-5 w-px bg-stone-300" />
        <button onClick={() => step(-10)} title="Zoom out" className="toolbar-btn" disabled={zoom <= 50}>
          −
        </button>
        <span className="w-12 text-center text-xs font-medium text-stone-600">{zoom}%</span>
        <button onClick={() => step(10)} title="Zoom in" className="toolbar-btn" disabled={zoom >= 150}>
          +
        </button>
        <button onClick={() => setZoom(100)} title="Reset zoom" className="toolbar-btn text-xs">
          Reset
        </button>
        <span className="flex-1" />
        <Link href={closeHref} className="toolbar-btn" title="Close">
          ✕ <span className="hidden sm:inline">Close</span>
        </Link>
      </div>

      {/* Paper preview — CSS `zoom` scales it on screen only; print always renders at 100%
          (see the .doc-zoom override in globals.css). */}
      <div className="overflow-auto px-4 py-8 print:overflow-visible print:p-0">
        <div className="doc-zoom mx-auto w-fit" style={{ zoom: zoom / 100 }}>
          {children}
        </div>
      </div>

      {/* Status bar */}
      <div className="no-print sticky bottom-0 flex items-center justify-between border-t border-stone-300 bg-stone-100 px-4 py-1.5 text-xs text-stone-500">
        <span>Page 1 of 1</span>
        <span>Zoom Factor: {zoom}%</span>
      </div>
    </div>
  );
}
