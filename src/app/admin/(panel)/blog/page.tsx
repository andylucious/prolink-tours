import Link from "next/link";
import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { Empty, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Blog" };

export default async function BlogAdminPage() {
  const posts = await db.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <>
      <PageHeader
        title="Blog & travel guides"
        subtitle="Helpful articles bring visitors from Google."
        actions={
          <Link href="/admin/blog/edit" className="btn-primary">
            + New article
          </Link>
        }
      />
      {posts.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Published</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/blog/edit?id=${p.id}`} className="font-medium text-brand-700 hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-stone-500">/blog/{p.slug}</p>
                  </td>
                  <td>{date(p.publishedAt)}</td>
                  <td className="text-xs">{p.published ? <span className="text-emerald-700">Live</span> : <span className="text-stone-400">Draft</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No articles yet.</Empty>
      )}
    </>
  );
}
