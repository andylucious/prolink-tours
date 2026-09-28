import Link from "next/link";
import { createQuote } from "@/app/actions/sales";
import { PageHeader } from "@/components/admin/ui";
import { QuoteForm } from "../QuoteForm";

export const metadata = { title: "New quote" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  const { customerId } = await searchParams;
  return (
    <>
      <PageHeader
        title="New quote"
        back={{ href: "/admin/quotes", label: "Quotes" }}
        subtitle={
          <>
            Tip: quotes are fastest when created from an{" "}
            <Link href="/admin/inquiries" className="text-brand-700 underline">
              inquiry
            </Link>{" "}
            — prices are pre-filled from the tour&apos;s rate card.
          </>
        }
      />
      <QuoteForm action={createQuote} quote={{ customerId: customerId ? Number(customerId) : undefined }} submitLabel="Create quote" />
    </>
  );
}
