import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { Markdown } from "@/components/Markdown";

type Params = { params: Promise<{ slug: string }> };

const load = (slug: string) => db.blogPost.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await load((await params).slug);
  return p ? { title: p.title, description: p.excerpt } : {};
}

export default async function PostPage({ params }: Params) {
  const post = await load((await params).slug);
  if (!post) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/blog" className="text-sm font-semibold text-brand-700 hover:underline">
        ← All travel guides
      </Link>
      <p className="mt-6 text-sm text-stone-500">{date(post.publishedAt)}</p>
      <h1 className="mt-1 font-display text-4xl leading-tight">{post.title}</h1>
      <p className="mt-3 text-lg text-stone-600">{post.excerpt}</p>
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
      )}
      <div className="mt-8">
        <Markdown source={post.content} />
      </div>
      <div className="mt-12 rounded-2xl bg-brand-50 p-6">
        <p className="font-display text-xl text-brand-800">Ready to plan your trip?</p>
        <Link href="/inquire" className="btn-accent mt-4">
          Get a free quote
        </Link>
      </div>
    </article>
  );
}
