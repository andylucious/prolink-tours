import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/customer-auth";
import { BookingDocument, bookingOwner } from "@/components/print/BookingDocument";

// Lives outside the (site) group, like the tour itinerary print page, so it renders as a clean
// standalone A4 document with no site header/footer.
export const dynamic = "force-dynamic";

export default async function PrintMyBooking({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCustomer();
  const id = Number((await params).id);
  const owner = await bookingOwner(id);
  if (!owner || owner.customerId !== session.cid) notFound();
  return <BookingDocument id={id} closeHref={`/account/bookings/${id}`} />;
}
