import "server-only";
import { db } from "./db";

/** Seats sold per tour: every adult and child on a booking that hasn't been cancelled. */
export async function seatsTakenByTour(): Promise<Map<number, number>> {
  const rows = await db.booking.groupBy({
    by: ["tourId"],
    where: { status: { not: "CANCELLED" }, tourId: { not: null } },
    _sum: { adults: true, children: true },
  });
  return new Map(rows.map((r) => [r.tourId as number, (r._sum.adults ?? 0) + (r._sum.children ?? 0)]));
}

/** Seats still free, or null when the tour has no seat limit. Never below zero. */
export const seatsLeft = (capacity: number | null, taken: number) => (capacity == null ? null : Math.max(0, capacity - taken));
