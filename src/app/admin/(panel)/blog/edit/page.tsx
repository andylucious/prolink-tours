import { db } from "@/lib/db";
import { deleteBlogPost, saveBlogPost } from "@/app/actions/catalog";
import { dateInput } from "@/lib/format";
import { Card, Field, PageHeader } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";

export const metadata = { title: "Edit article" };

export default async function EditPostPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const post = id ? await db.blogPost.findUnique({ where: { id: Number(id) } }) : null;
  return (
    <>
      <PageHeader title={post ? "Edit article" : "New article"} back={{ href: "/admin/blog", label: "Blog" }} />
      <form action={saveBlogPost} className="space-y-6">
        {post && <input type="hidden" name="id" value={post.id} />}
        <Card>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Title *" className="md:col-span-3">
              <input name="title" required defaultValue={post?.title} className="input" />
            </Field>
            <Field label="Publish date">
              <input name="publishedAt" type="date" defaultValue={dateInput(post?.publishedAt ?? new Date())} className="input" />
            </Field>
            <Field label="Summary *" className="md:col-span-4">
              <input name="excerpt" required maxLength={480} defaultValue={post?.excerpt} className="input" />
            </Field>
            <Field label="Cover image URL" className="md:col-span-2">
              <input name="coverImage" defaultValue={post?.coverImage ?? ""} className="input" />
            </Field>
            <Field label="…or upload">
              <input name="coverFile" type="file" accept="image/*" className="input" />
            </Field>
            <Field label="URL slug">
              <input name="slug" defaultValue={post?.slug} className="input" placeholder="auto" />
            </Field>
            <Field label="Article" className="md:col-span-4">
              <textarea name="content" rows={18} defaultValue={post?.content} className="input font-mono text-xs" />
              <p className="mt-1 text-xs text-stone-500">
                Formatting: start a line with <code>## </code> for a heading, <code>- </code> for a bullet, wrap words in <code>**bold**</code>. Leave a blank line between paragraphs.
              </p>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="published" defaultChecked={post?.published ?? true} className="accent-brand-600" /> Published
            </label>
          </div>
        </Card>
        <SubmitButton>Save article</SubmitButton>
      </form>
      {post && (
        <form action={deleteBlogPost.bind(null, post.id)} className="mt-8">
          <ConfirmButton message="Delete this article?">Delete article</ConfirmButton>
        </form>
      )}
    </>
  );
}
