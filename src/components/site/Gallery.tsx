"use client";

import { useEffect, useState } from "react";

export function Gallery({ images }: { images: { url: string; caption: string | null }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (!images.length) return null;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((img, i) => (
          <button key={img.url + i} onClick={() => setOpen(i)} className="group aspect-[4/3] overflow-hidden rounded-xl bg-sand-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption ?? ""} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[open].url} alt={images[open].caption ?? ""} className="max-h-[85vh] max-w-full rounded-lg object-contain" />
          {images[open].caption && <p className="absolute bottom-6 text-center text-sm text-white/80">{images[open].caption}</p>}
          <button className="absolute right-5 top-5 text-3xl text-white" aria-label="Close">
            ×
          </button>
        </div>
      )}
    </>
  );
}
