"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AddOnType, PriceUnit, Residency, SeasonType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { bool, dateOrNull, dec, int, items, opt, str } from "@/lib/form";
import { slugify } from "@/lib/format";
import { imageFrom, saveUpload } from "@/lib/upload";

const refreshSite = () => revalidatePath("/", "layout");

async function uniqueSlug(model: "tour" | "blogPost" | "category", base: string, ignoreId?: number) {
  let slug = slugify(base) || "item";
  for (let n = 2; ; n++) {
    const hit =
      model === "tour"
        ? await db.tour.findUnique({ where: { slug } })
        : model === "blogPost"
          ? await db.blogPost.findUnique({ where: { slug } })
          : await db.category.findUnique({ where: { slug } });
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${slugify(base)}-${n}`;
  }
}

// ───────── Tours ─────────

async function tourData(fd: FormData) {
  return {
    title: str(fd, "title"),
    summary: str(fd, "summary"),
    description: str(fd, "description"),
    destination: str(fd, "destination"),
    durationDays: Math.max(1, int(fd, "durationDays", 1)),
    categoryId: int(fd, "categoryId"),
    inclusions: str(fd, "inclusions"),
    exclusions: str(fd, "exclusions"),
    priceFrom: dec(fd, "priceFrom"),
    currency: str(fd, "currency") || "USD",
    featured: bool(fd, "featured"),
    published: bool(fd, "published"),
    coverImage: await imageFrom(fd, "coverFile", "coverImage"),
    addOns: { set: fd.getAll("addOnIds").map((v) => ({ id: Number(v) })) },
  };
}

export async function createTour(fd: FormData) {
  await requireUser();
  const data = await tourData(fd);
  const tour = await db.tour.create({
    data: { ...data, addOns: { connect: data.addOns.set }, slug: await uniqueSlug("tour", str(fd, "slug") || data.title) },
  });
  refreshSite();
  redirect(`/admin/tours/${tour.id}?tab=itinerary`);
}

export async function updateTour(id: number, fd: FormData) {
  await requireUser();
  const data = await tourData(fd);
  await db.tour.update({ where: { id }, data: { ...data, slug: await uniqueSlug("tour", str(fd, "slug") || data.title, id) } });
  refreshSite();
  redirect(`/admin/tours/${id}?saved=1`);
}

export async function deleteTour(id: number) {
  await requireUser();
  await db.tour.delete({ where: { id } });
  refreshSite();
  redirect("/admin/tours");
}

type DayInput = { title: string; description: string; accommodation?: string; meals?: string };
export async function saveTourDays(id: number, fd: FormData) {
  await requireUser();
  const days = items<DayInput>(fd, "days").filter((d) => d.title?.trim());
  await db.$transaction([
    db.tourDay.deleteMany({ where: { tourId: id } }),
    db.tourDay.createMany({
      data: days.map((d, i) => ({ tourId: id, dayNumber: i + 1, title: d.title.trim(), description: d.description ?? "", accommodation: d.accommodation || null, meals: d.meals || null })),
    }),
  ]);
  refreshSite();
  redirect(`/admin/tours/${id}?tab=itinerary&saved=1`);
}

type RateRow = { season: SeasonType; residency: Residency; minPax: number; maxPax: number; pricePerPerson: number; currency: string };
export async function saveTourRates(id: number, fd: FormData) {
  await requireUser();
  const rates = items<RateRow>(fd, "rates").filter((r) => Number(r.pricePerPerson) > 0);
  await db.$transaction([
    db.tourRate.deleteMany({ where: { tourId: id } }),
    db.tourRate.createMany({
      data: rates.map((r) => ({
        tourId: id,
        season: r.season,
        residency: r.residency,
        minPax: Number(r.minPax) || 1,
        maxPax: Number(r.maxPax) || 99,
        pricePerPerson: Number(r.pricePerPerson),
        currency: r.currency || "USD",
      })),
    }),
  ]);
  refreshSite();
  redirect(`/admin/tours/${id}?tab=pricing&saved=1`);
}

export async function addTourImages(id: number, fd: FormData) {
  await requireUser();
  const urls: string[] = [];
  for (const f of fd.getAll("files")) {
    const u = await saveUpload(f);
    if (u) urls.push(u);
  }
  const pasted = str(fd, "url");
  if (pasted) urls.push(pasted);
  const max = await db.tourImage.aggregate({ where: { tourId: id }, _max: { sort: true } });
  await db.tourImage.createMany({ data: urls.map((url, i) => ({ tourId: id, url, caption: opt(fd, "caption"), sort: (max._max.sort ?? 0) + i + 1 })) });
  refreshSite();
  redirect(`/admin/tours/${id}?tab=photos`);
}

export async function deleteTourImage(imageId: number) {
  await requireUser();
  const img = await db.tourImage.delete({ where: { id: imageId } });
  refreshSite();
  redirect(`/admin/tours/${img.tourId}?tab=photos`);
}

export async function setCoverFromImage(imageId: number) {
  await requireUser();
  const img = await db.tourImage.findUniqueOrThrow({ where: { id: imageId } });
  await db.tour.update({ where: { id: img.tourId }, data: { coverImage: img.url } });
  refreshSite();
  redirect(`/admin/tours/${img.tourId}?tab=photos`);
}

// ───────── Categories / add-ons / seasons ─────────

export async function saveCategory(fd: FormData) {
  await requireUser();
  const id = int(fd, "id");
  const data = {
    name: str(fd, "name"),
    description: opt(fd, "description"),
    image: await imageFrom(fd, "imageFile", "image"),
    sort: int(fd, "sort"),
    slug: await uniqueSlug("category", str(fd, "name"), id || undefined),
  };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  refreshSite();
  redirect("/admin/catalog");
}

export async function deleteCategory(id: number) {
  await requireUser();
  if (await db.tour.count({ where: { categoryId: id } })) redirect("/admin/catalog?error=category-in-use");
  await db.category.delete({ where: { id } });
  refreshSite();
  redirect("/admin/catalog");
}

export async function saveAddOn(fd: FormData) {
  await requireUser();
  const id = int(fd, "id");
  const data = {
    name: str(fd, "name"),
    type: str(fd, "type") as AddOnType,
    description: opt(fd, "description"),
    price: dec(fd, "price"),
    currency: str(fd, "currency") || "USD",
    unit: str(fd, "unit") as PriceUnit,
    active: bool(fd, "active"),
  };
  if (id) await db.addOn.update({ where: { id }, data });
  else await db.addOn.create({ data });
  refreshSite();
  redirect("/admin/catalog#addons");
}

export async function deleteAddOn(id: number) {
  await requireUser();
  await db.addOn.delete({ where: { id } });
  refreshSite();
  redirect("/admin/catalog#addons");
}

export async function saveSeason(fd: FormData) {
  await requireUser();
  const id = int(fd, "id");
  const data = {
    name: str(fd, "name"),
    type: (str(fd, "type") || "PEAK") as SeasonType,
    startDate: dateOrNull(fd, "startDate") ?? new Date(),
    endDate: dateOrNull(fd, "endDate") ?? new Date(),
  };
  if (id) await db.season.update({ where: { id }, data });
  else await db.season.create({ data });
  refreshSite();
  redirect("/admin/catalog#seasons");
}

export async function deleteSeason(id: number) {
  await requireUser();
  await db.season.delete({ where: { id } });
  refreshSite();
  redirect("/admin/catalog#seasons");
}

// ───────── Blog ─────────

export async function saveBlogPost(fd: FormData) {
  await requireUser();
  const id = int(fd, "id");
  const data = {
    title: str(fd, "title"),
    excerpt: str(fd, "excerpt"),
    content: str(fd, "content"),
    coverImage: await imageFrom(fd, "coverFile", "coverImage"),
    published: bool(fd, "published"),
    publishedAt: dateOrNull(fd, "publishedAt") ?? new Date(),
    slug: await uniqueSlug("blogPost", str(fd, "slug") || str(fd, "title"), id || undefined),
  };
  if (id) await db.blogPost.update({ where: { id }, data });
  else await db.blogPost.create({ data });
  refreshSite();
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: number) {
  await requireUser();
  await db.blogPost.delete({ where: { id } });
  refreshSite();
  redirect("/admin/blog");
}
