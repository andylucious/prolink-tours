import { db } from "@/lib/db";
import { createInquiry } from "@/app/actions/crm";
import { Card, EnumSelect, Field, PageHeader } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";

export const metadata = { title: "Log inquiry" };

export default async function NewInquiryPage() {
  const tours = await db.tour.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } });
  return (
    <>
      <PageHeader title="Log an inquiry" subtitle="For leads received by phone, WhatsApp, email or walk-in." back={{ href: "/admin/inquiries", label: "Inquiries" }} />
      <form action={createInquiry}>
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Client name *">
              <input name="name" required className="input" />
            </Field>
            <Field label="Email *">
              <input name="email" type="email" required className="input" />
            </Field>
            <Field label="Phone">
              <input name="phone" className="input" />
            </Field>
            <Field label="Country">
              <input name="country" className="input" />
            </Field>
            <Field label="Residency">
              <EnumSelect name="residency" values={["NON_RESIDENT", "RESIDENT"]} />
            </Field>
            <Field label="Source">
              <EnumSelect name="source" values={["PHONE", "WHATSAPP", "EMAIL", "WALK_IN", "REFERRAL", "WEBSITE"]} />
            </Field>
            <Field label="Tour" className="md:col-span-3">
              <select name="tourId" className="input">
                <option value="">Custom trip</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start date">
              <input name="startDate" type="date" className="input" />
            </Field>
            <Field label="End date">
              <input name="endDate" type="date" className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Adults">
                <input name="adults" type="number" min={1} defaultValue={2} className="input" />
              </Field>
              <Field label="Children">
                <input name="children" type="number" min={0} defaultValue={0} className="input" />
              </Field>
            </div>
            <Field label="Request details" className="md:col-span-3">
              <textarea name="message" rows={4} className="input" />
            </Field>
          </div>
          <div className="mt-5">
            <SubmitButton>Save inquiry</SubmitButton>
          </div>
        </Card>
      </form>
    </>
  );
}
