import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "Travel Guides & Safari Tips" };

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Blog</p>
      <h1 className="mt-1 font-display text-4xl">Travel guides & safari tips</h1>
      <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="group">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-sand-200">
              {p.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage} alt="" className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
              )}
            </div>
            <p className="mt-4 text-xs text-stone-500">{date(p.publishedAt)}</p>
            <p className="mt-1 font-display text-xl group-hover:text-brand-700">{p.title}</p>
            <p className="mt-1 text-sm text-stone-600">{p.excerpt}</p>
          </Link>
        ))}
        {!posts.length && <p className="text-stone-600">No articles yet — check back soon.</p>}
      </div>
    </div>
  );
}
