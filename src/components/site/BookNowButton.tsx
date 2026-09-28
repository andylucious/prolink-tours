"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { PricingData } from "@/lib/catalog";

// Loaded only once the visitor actually opens it, instead of bloating every tour page's bundle.
const BookingForm = dynamic(() => import("./BookingForm").then((m) => m.BookingForm), { ssr: false });

export function BookNowButton({ data, tour, loggedIn, className = "btn-primary mt-3 w-full py-3 text-base" }: { data: PricingData; tour: PricingData["tours"][number]; loggedIn: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        Book this trip
      </button>
      {open && <BookingForm data={data} tour={tour} loggedIn={loggedIn} onClose={() => setOpen(false)} />}
    </>
  );
}
