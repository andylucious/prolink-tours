import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { date, toNum } from "@/lib/format";
import { PrintShell } from "../../PrintShell";

// Service voucher handed to the lodge/transporter confirming what we booked.
export default async function PrintVoucher({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  const [v, s] = await Promise.all([
    db.bookingService.findUnique({ where: { id }, include: { supplier: true, booking: { include: { customer: true } } } }),
    getSettings(),
  ]);
  if (!v) notFound();
  const b = v.booking;

  return (
    <PrintShell s={s} docType="Service Voucher" number={v.voucherNo} closeHref={`/admin/bookings/${v.bookingId}`}>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs uppercase text-stone-500">To (supplier)</p>
          <p className="font-semibold">{v.supplier?.name ?? "—"}</p>
          <p>{v.supplier?.location}</p>
          <p>{v.supplier?.email}</p>
          <p>{v.supplier?.phone}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-stone-500">Booking ref:</span> <strong>{b.ref}</strong>
          </p>
          <p>
            <span className="text-stone-500">Issued:</span> {date(new Date())}
          </p>
        </div>
      </div>
      <table className="mt-8 w-full border border-stone-300">
        <tbody>
          {[
            ["Guest name", b.customer.name],
            ["Number of guests", `${b.adults} adults${b.children ? `, ${b.children} children` : ""}`],
            ["Service date", date(v.serviceDate)],
            ["Trip dates", `${date(b.startDate)} – ${date(b.endDate)}`],
            ["Service", v.description],
            ["Quantity", String(toNum(v.quantity))],
          ].map(([k, val]) => (
            <tr key={k} className="border-b border-stone-200">
              <th className="w-48 bg-stone-50 px-3 py-2 text-left text-xs uppercase text-stone-500">{k}</th>
              <td className="px-3 py-2">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {v.notes && <p className="mt-4 whitespace-pre-line rounded bg-stone-50 p-3">{v.notes}</p>}
      <p className="mt-8 text-xs text-stone-600">
        Please provide the above services to the guest(s) named. Billing to {s.companyName} as per agreed contract rates — the guest should not be charged for services listed on
        this voucher. Extras are payable directly by the guest.
      </p>
      <div className="mt-16 grid grid-cols-2 gap-10 text-xs">
        <p className="border-t border-stone-400 pt-1">Authorised by {s.companyName}</p>
        <p className="border-t border-stone-400 pt-1">Received by supplier</p>
      </div>
    </PrintShell>
  );
}
