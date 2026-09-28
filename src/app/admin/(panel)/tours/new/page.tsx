import { createTour } from "@/app/actions/catalog";
import { PageHeader } from "@/components/admin/ui";
import { TourForm } from "../TourForm";

export const metadata = { title: "New tour" };

const DEFAULT_INC = "Park entry fees\nGame drives in a 4x4 safari vehicle\nProfessional driver-guide\nAccommodation as per itinerary\nMeals as indicated\nBottled water in the vehicle";
const DEFAULT_EXC = "International flights and visas\nTravel insurance\nTips and gratuities\nDrinks\nPersonal items";

export default function NewTourPage() {
  return (
    <>
      <PageHeader title="New tour" subtitle="After saving you can add the day-by-day itinerary, rates and photos." back={{ href: "/admin/tours", label: "Tours" }} />
      <TourForm action={createTour} tour={{ inclusions: DEFAULT_INC, exclusions: DEFAULT_EXC }} submitLabel="Create tour" />
    </>
  );
}
