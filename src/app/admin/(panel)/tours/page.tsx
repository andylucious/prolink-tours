import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { Empty, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Tours" };

export default async function ToursAdminPage() {
  const tours = await db.tour.findMany({
    include: { category: true, _count: { select: { days: true, rates: true, images: true, inquiries: true, bookings: true } } },
    orderBy: [{ category: { sort: "asc" } }, { title: "asc" }],
  });
  return (
    <>
      <PageHeader
        title="Tours"
        subtitle="Packages shown on the website."
        actions={
          <Link href="/admin/tours/new" className="btn-primary">
            + New tour
          </Link>
        }
      />
      {tours.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>Tour</th>
                <th>Category</th>
                <th>From</th>
                <th>Content</th>
                <th className="text-right">Inquiries / bookings</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((t) => (
                <tr key={t.id}>
                  <td className="w-20">
                    {t.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.coverImage} alt="" className="h-12 w-16 rounded object-cover" />
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/tours/${t.id}`} className="font-medium text-brand-700 hover:underline">
                      {t.title}
                    </Link>
                    <p className="text-xs text-stone-500">
                      {t.durationDays} days · {t.destination}
                    </p>
                  </td>
                  <td>{t.category.name}</td>
                  <td className="whitespace-nowrap">{money(t.priceFrom, t.currency)}</td>
                  <td className="text-xs text-stone-600">
                    {t._count.days} days · {t._count.rates} rates · {t._count.images} photos
                  </td>
                  <td className="text-right">
                    {t._count.inquiries} / {t._count.bookings}
                  </td>
                  <td className="text-xs">
                    {t.published ? <span className="text-emerald-700">Published</span> : <span className="text-stone-400">Hidden</span>}
                    {t.featured && <span className="ml-1 rounded bg-accent-100 px-1.5 text-accent-600">★</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No tours yet.</Empty>
      )}
    </>
  );
}
