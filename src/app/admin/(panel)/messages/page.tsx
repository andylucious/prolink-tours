import { db } from "@/lib/db";
import { deleteMessage, toggleMessageRead } from "@/app/actions/system";
import { date } from "@/lib/format";
import { Empty, PageHeader } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/client";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader title="Contact messages" subtitle="From the website contact form." />
      {messages.length ? (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`card p-5 ${m.read ? "opacity-70" : "border-l-4 border-l-accent-500"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {m.name} {m.subject && <span className="font-normal text-stone-500">— {m.subject}</span>}
                  </p>
                  <p className="text-xs text-stone-500">
                    <a href={`mailto:${m.email}`} className="text-brand-700">
                      {m.email}
                    </a>
                    {m.phone && ` · ${m.phone}`} · {date(m.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleMessageRead.bind(null, m.id)}>
                    <button className="btn-outline btn-sm">{m.read ? "Mark unread" : "Mark read"}</button>
                  </form>
                  <form action={deleteMessage.bind(null, m.id)}>
                    <ConfirmButton message="Delete message?">Delete</ConfirmButton>
                  </form>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <Empty>No messages yet.</Empty>
      )}
    </>
  );
}
