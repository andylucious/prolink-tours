import { createBooking } from "@/app/actions/ops";
import { Card, PageHeader } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";
import { BookingFields } from "../BookingFields";

export const metadata = { title: "New booking" };

export default function NewBookingPage() {
  return (
    <>
      <PageHeader title="New booking" subtitle="Usually bookings are created by accepting a quote — use this for direct bookings." back={{ href: "/admin/bookings", label: "Bookings" }} />
      <form action={createBooking}>
        <Card>
          <BookingFields />
          <div className="mt-5">
            <SubmitButton>Create booking</SubmitButton>
          </div>
        </Card>
      </form>
    </>
  );
}
