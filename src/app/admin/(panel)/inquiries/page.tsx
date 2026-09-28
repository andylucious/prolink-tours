import Link from "next/link";
import type { InquiryStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { date, money } from "@/lib/format";
import { Badge, Empty, PageHeader, SearchBar } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";
import { convertInquiryToQuote } from "@/app/actions/crm";

export const metadata = { title: "Inquiries" };
const STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"] as const;

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const [list, counts] = await Promise.all([
    db.inquiry.findMany({
      where: {
        ...(status ? { status: status as InquiryStatus } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { ref: { contains: q } }, { phone: { contains: q } }] } : {}),
      },
      include: { tour: { select: { title: true } }, assignedTo: { select: { name: true } }, quotes: { select: { id: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.inquiry.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader
        title="Inquiries"
        subtitle="Leads from the website form, WhatsApp, phone and walk-ins."
        actions={
          <Link href="/admin/inquiries/new" className="btn-primary">
            + Log inquiry
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/inquiries" className={`rounded-full px-3 py-1 text-sm ${!status ? "bg-brand-700 text-white" : "bg-white ring-1 ring-stone-200"}`}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/inquiries?status=${s}`} className={`rounded-full px-3 py-1 text-sm ${status === s ? "bg-brand-700 text-white" : "bg-white ring-1 ring-stone-200"}`}>
            {s.charAt(0) + s.slice(1).toLowerCase()} <span className="opacity-60">({count(s)})</span>
          </Link>
        ))}
      </div>
      <SearchBar q={q} placeholder="Name, email, phone or ref…">
        {status && <input type="hidden" name="status" value={status} />}
      </SearchBar>
      {list.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Client</th>
                <th>Trip</th>
                <th>Travel date</th>
                <th>Pax</th>
                <th className="text-right">Estimate</th>
                <th>Assigned</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id}>
                  <td className="whitespace-nowrap text-stone-500">{date(i.createdAt)}</td>
                  <td>
                    <Link href={`/admin/inquiries/${i.id}`} className="font-medium text-brand-700 hover:underline">
                      {i.name}
                    </Link>
                    <p className="text-xs text-stone-500">
                      {i.ref} · {i.source.replace("_", " ").toLowerCase()}
                    </p>
                  </td>
                  <td>{i.tour?.title ?? <span className="text-stone-400">Custom</span>}</td>
                  <td className="whitespace-nowrap">{date(i.startDate)}</td>
                  <td>
                    {i.adults + i.children}
                    <span className="text-xs text-stone-400"> {i.residency === "RESIDENT" ? "res" : "non-res"}</span>
                  </td>
                  <td className="whitespace-nowrap text-right">{i.estimatedTotal ? money(i.estimatedTotal, i.currency) : "—"}</td>
                  <td className="text-stone-600">{i.assignedTo?.name ?? "—"}</td>
                  <td>
                    <Badge value={i.status} />
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {i.quotes[0] ? (
                      <Link href={`/admin/quotes/${i.quotes[0].id}`} className="btn-outline btn-sm">
                        View quote
                      </Link>
                    ) : i.status !== "LOST" ? (
                      <form action={convertInquiryToQuote.bind(null, i.id)}>
                        <SubmitButton className="btn-primary btn-sm" pendingLabel="Creating…">
                          Create quote →
                        </SubmitButton>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No inquiries found.</Empty>
      )}
    </>
  );
}

