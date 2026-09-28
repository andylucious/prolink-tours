import { requireUser } from "@/lib/auth";
import { BookingDocument } from "@/components/print/BookingDocument";

export default async function PrintBooking({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  return <BookingDocument id={id} />;
}
