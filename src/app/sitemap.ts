import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const base = process.env.SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tours, posts] = await Promise.all([
    db.tour.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    ...["", "/tours", "/about", "/blog", "/contact", "/inquire"].map((p) => ({ url: `${base}${p}` })),
    ...tours.map((t) => ({ url: `${base}/tours/${t.slug}`, lastModified: t.updatedAt })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
