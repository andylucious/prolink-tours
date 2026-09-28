"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { can, type Permission } from "@/lib/permissions";

type Item = { href: string; label: string; icon: string; badge?: number; adminOnly?: boolean; perm?: Permission };
type Group = { title: string; items: Item[] };

export function Sidebar({
  companyName,
  role,
  permissions,
  counts,
}: {
  companyName: string;
  role: "ADMIN" | "STAFF";
  permissions: Permission[];
  counts: { inquiries: number; messages: number };
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const groups: Group[] = [
    { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "▦" }, { href: "/admin/reports", label: "Reports", icon: "◔", perm: "reports" }] },
    {
      title: "Sales",
      items: [
        { href: "/admin/inquiries", label: "Inquiries", icon: "✉", badge: counts.inquiries, perm: "sales" },
        { href: "/admin/customers", label: "Customers", icon: "☺", perm: "sales" },
        { href: "/admin/quotes", label: "Quotes", icon: "❝", perm: "sales" },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/admin/bookings", label: "Bookings", icon: "✓", perm: "operations" },
        { href: "/admin/suppliers", label: "Suppliers", icon: "⌂", perm: "operations" },
      ],
    },
    {
      title: "Finance",
      items: [
        { href: "/admin/invoices", label: "Invoices", icon: "≣", perm: "finance" },
        { href: "/admin/payments", label: "Payments received", icon: "↓", perm: "finance" },
        { href: "/admin/supplier-payments", label: "Supplier payments", icon: "↑", perm: "finance" },
      ],
    },
    {
      title: "Website",
      items: [
        { href: "/admin/tours", label: "Tours", icon: "⛰", perm: "website" },
        { href: "/admin/catalog", label: "Categories & pricing", icon: "⚙", perm: "website" },
        { href: "/admin/blog", label: "Blog", icon: "✎", perm: "website" },
        { href: "/admin/messages", label: "Messages", icon: "☏", badge: counts.messages, perm: "website" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/admin/users", label: "Staff users", icon: "♙", adminOnly: true },
        { href: "/admin/settings", label: "Settings", icon: "⚒", adminOnly: true },
      ],
    },
  ];

  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  const session = { role, permissions };

  const nav = (
    <nav className="space-y-6 px-3 py-5">
      {groups.map((g) => {
        const items = g.items.filter((i) => (!i.adminOnly || role === "ADMIN") && (!i.perm || can(session, i.perm)));
        if (!items.length) return null;
        return (
          <div key={g.title}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-200/60">{g.title}</p>
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 active:scale-[0.97] ${
                  isActive(i.href) ? "bg-white/10 font-semibold text-white" : "text-brand-100 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-4 text-center opacity-80">{i.icon}</span>
                <span className="flex-1">{i.label}</span>
                {!!i.badge && <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-white">{i.badge}</span>}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="no-print flex h-14 items-center justify-between bg-brand-900 px-4 lg:hidden">
        <span className="font-semibold text-white">{companyName}</span>
        <button onClick={() => setOpen(!open)} className="rounded-md border border-white/20 px-3 py-1 text-sm text-white">
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && <div className="no-print bg-brand-900 lg:hidden">{nav}</div>}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 overflow-y-auto bg-brand-900 lg:block">
        <Link href="/admin" className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-500 text-white">◭</span>
          <span className="text-sm font-semibold leading-tight text-white">{companyName}</span>
        </Link>
        {nav}
      </aside>
    </>
  );
}
