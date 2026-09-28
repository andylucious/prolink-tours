import type { Metadata } from "next";
import { getPricingData } from "@/lib/catalog";
import { InquiryForm } from "@/components/site/InquiryForm";

export const metadata: Metadata = { title: "Plan Your Trip — Request a Quote" };

export default async function InquirePage({ searchParams }: { searchParams: Promise<{ tour?: string }> }) {
  const [{ tour }, data] = await Promise.all([searchParams, getPricingData()]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Plan your trip</p>
      <h1 className="mt-1 font-display text-4xl text-stone-900">Request a tailored quote</h1>
      <p className="mt-2 max-w-2xl text-stone-600">Tell us when you&apos;d like to travel and who&apos;s coming. You&apos;ll see an instant estimate, and our team will follow up with a detailed quote.</p>
      <div className="mt-10">
        <InquiryForm data={data} defaultSlug={tour} />
      </div>
    </div>
  );
}
