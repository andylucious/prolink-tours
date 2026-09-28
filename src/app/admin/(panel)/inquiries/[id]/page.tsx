import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { convertInquiryToQuote, deleteInquiry, updateInquiry } from "@/app/actions/crm";
import { getPricingData } from "@/lib/catalog";
import { estimate } from "@/lib/pricing";
import { date, label, money } from "@/lib/format";
import { Badge, Card, DL, EnumSelect, Field, PageHeader } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [inq, users, pricing] = await Promise.all([
    db.inquiry.findUnique({
      where: { id },
      include: { tour: true, addOns: { include: { addOn: true } }, quotes: { orderBy: { createdAt: "desc" } }, customer: true },
    }),
    db.user.findMany({ where: { active: true }, select: { id: true, name: true } }),
    getPricingData(),
  ]);
  if (!inq) notFound();
  const wa = inq.phone ? `https://wa.me/${inq.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${inq.name}, thank you for your inquiry (${inq.ref}).`)}` : null;

  // Recompute the same itemized breakdown the customer saw — tour cost plus each add-on's own
  // quantity × rate, with the add-on's own description (car model, seats, meal plan, etc.).
  const pricingTour = inq.tourId ? pricing.tours.find((t) => t.id === inq.tourId) : undefined;
  const est =
    pricingTour &&
    estimate({
      rates: pricingTour.rates,
      seasons: pricing.seasons,
      addOns: pricing.addOns.filter((a) => inq.addOns.some((x) => x.addOnId === a.id)),
      startDate: inq.startDate?.toISOString(),
      residency: inq.residency,
      adults: inq.adults,
      children: inq.children,
      days: pricingTour.durationDays,
      usdToKes: pricing.usdToKes,
    });

  return (
    <>
      <PageHeader
        title={inq.name}
        subtitle={
          <span className="flex items-center gap-2">
            {inq.ref} · received {date(inq.createdAt)} <Badge value={inq.status} />
          </span>
        }
        back={{ href: "/admin/inquiries", label: "Inquiries" }}
        actions={
          <>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1fb857]">
                WhatsApp
              </a>
            )}
            <a href={`mailto:${inq.email}?subject=${encodeURIComponent(`Your trip inquiry ${inq.ref}`)}`} className="btn-outline">
              Email
            </a>
            <form action={convertInquiryToQuote.bind(null, inq.id)}>
              <SubmitButton>Create quote →</SubmitButton>
            </form>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Trip request">
            <DL
              items={[
                ["Tour", inq.tour ? <Link href={`/tours/${inq.tour.slug}`} target="_blank" className="text-brand-700 hover:underline">{inq.tour.title}</Link> : "Custom trip"],
                ["Dates", `${date(inq.startDate)} → ${date(inq.endDate)}`],
                ["Travellers", `${inq.adults} adults, ${inq.children} children`],
                ["Residency", label(inq.residency)],
              ]}
            />
            {inq.message && <p className="mt-5 whitespace-pre-line rounded-lg bg-sand-100 p-4 text-sm">{inq.message}</p>}
          </Card>

          <Card title="Detailed price breakdown">
            {est ? (
              <>
                <p className="mb-3 text-xs text-stone-500">
                  {pricingTour?.title} · {est.season === "PEAK" ? "Peak" : "Low"} season · recalculated from today&apos;s rates
                </p>
                <ul className="space-y-2.5 text-sm">
                  {est.lines.map((l, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="text-stone-700">
                        {l.label}
                        {l.detail && <span className="block text-xs text-stone-400">{l.detail}</span>}
                      </span>
                      <span className="shrink-0 font-medium">{money(l.amount, est.currency)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-baseline justify-between border-t border-stone-200 pt-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold text-brand-700">{money(est.total, est.currency)}</span>
                </div>
                {inq.estimatedTotal && Math.abs(Number(inq.estimatedTotal) - est.total) > 0.01 && (
                  <p className="mt-2 text-xs text-amber-700">
                    Website showed {money(inq.estimatedTotal, inq.currency)} at the time of inquiry — prices may have changed since.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-stone-500">
                Custom trip — no tour selected, so there&apos;s no automatic breakdown.
                {inq.estimatedTotal && <> Website estimate: {money(inq.estimatedTotal, inq.currency)}.</>}
              </p>
            )}
          </Card>

          <Card title="Quotes">
            {inq.quotes.length ? (
              <ul className="divide-y divide-stone-100 text-sm">
                {inq.quotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/quotes/${q.id}`} className="text-brand-700 hover:underline">
                      {q.number} — {q.title}
                    </Link>
                    <Badge value={q.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No quotes yet. Click “Create quote” to build one from this inquiry.</p>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Contact">
            <DL
              items={[
                ["Email", <a key="e" href={`mailto:${inq.email}`} className="text-brand-700">{inq.email}</a>],
                ["Phone", inq.phone],
                ["Country", inq.country],
                ["Customer", inq.customer ? <Link key="c" href={`/admin/customers/${inq.customer.id}`} className="text-brand-700">{inq.customer.name}</Link> : "Not yet created"],
              ]}
            />
          </Card>
          <Card title="Follow-up">
            <form action={updateInquiry.bind(null, inq.id)} className="space-y-4">
              <Field label="Status">
                <EnumSelect name="status" values={["NEW", "CONTACTED", "QUOTED", "WON", "LOST"]} defaultValue={inq.status} />
              </Field>
              <Field label="Source">
                <EnumSelect name="source" values={["WEBSITE", "WHATSAPP", "PHONE", "EMAIL", "WALK_IN", "REFERRAL"]} defaultValue={inq.source} />
              </Field>
              <Field label="Assigned to">
                <select name="assignedToId" defaultValue={inq.assignedToId ?? ""} className="input">
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Internal notes">
                <textarea name="notes" rows={4} defaultValue={inq.notes ?? ""} className="input" />
              </Field>
              <SubmitButton>Save</SubmitButton>
            </form>
          </Card>
          <form action={deleteInquiry.bind(null, inq.id)}>
            <ConfirmButton message="Delete this inquiry permanently?">Delete inquiry</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
