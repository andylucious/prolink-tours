import Link from "next/link";
import { getPermissions, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Sidebar } from "@/components/admin/Sidebar";
import { logout } from "@/app/actions/auth";

export const metadata = { title: { default: "Back office", template: "%s · ERP" } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const [s, inquiries, messages, permissions] = await Promise.all([
    getSettings(),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.contactMessage.count({ where: { read: false } }),
    session.role === "ADMIN" ? Promise.resolve([]) : getPermissions(session.uid),
  ]);
  return (
    <div className="min-h-screen bg-stone-50">
      <Sidebar companyName={s.companyName} role={session.role} permissions={permissions} counts={{ inquiries, messages }} />
      <div className="lg:pl-64 print:pl-0">
        <header className="no-print flex h-16 items-center justify-end gap-4 border-b border-stone-200 bg-white px-6">
          <Link href="/" target="_blank" className="text-sm text-stone-500 hover:text-brand-700">
            View website ↗
          </Link>
          <span className="text-sm text-stone-700">
            {session.name} <span className="text-xs text-stone-400">({session.role.toLowerCase()})</span>
          </span>
          <form action={logout}>
            <button className="btn-outline btn-sm">Sign out</button>
          </form>
        </header>
        <main className="mx-auto max-w-7xl p-6 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
