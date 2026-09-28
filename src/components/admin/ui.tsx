import Link from "next/link";
import { label } from "@/lib/format";

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="text-sm text-stone-500 hover:text-brand-700">
          ← {back.label}
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-stone-500">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

const tones: Record<string, string> = {
  // inquiry
  NEW: "bg-blue-50 text-blue-700 ring-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 ring-amber-200",
  QUOTED: "bg-violet-50 text-violet-700 ring-violet-200",
  WON: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LOST: "bg-stone-100 text-stone-600 ring-stone-200",
  // quote
  DRAFT: "bg-stone-100 text-stone-600 ring-stone-200",
  SENT: "bg-blue-50 text-blue-700 ring-blue-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DECLINED: "bg-red-50 text-red-700 ring-red-200",
  EXPIRED: "bg-stone-100 text-stone-500 ring-stone-200",
  // booking
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-stone-100 text-stone-700 ring-stone-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  // services
  REQUESTED: "bg-amber-50 text-amber-700 ring-amber-200",
  // invoice
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VOID: "bg-stone-100 text-stone-500 ring-stone-200",
  OVERDUE: "bg-red-50 text-red-700 ring-red-200",
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[value] ?? "bg-stone-100 text-stone-700 ring-stone-200"}`}>
      {label(value)}
    </span>
  );
}

export function Card({ title, actions, children, className = "" }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3">
          <h2 className="font-semibold text-stone-800">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ label: l, value, hint, href }: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{l}</p>
      <p className="mt-2 text-2xl font-bold text-stone-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition hover:border-brand-300 hover:shadow-md active:scale-[0.98]">
      {body}
    </Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">{children}</div>;
}

export function Field({ label: l, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="label">{l}</span>
      {children}
    </div>
  );
}

export function EnumSelect({ name, values, defaultValue, className = "input", allowEmpty }: { name: string; values: readonly string[]; defaultValue?: string | null; className?: string; allowEmpty?: string }) {
  return (
    <select name={name} defaultValue={defaultValue ?? ""} className={className}>
      {allowEmpty !== undefined && <option value="">{allowEmpty}</option>}
      {values.map((v) => (
        <option key={v} value={v}>
          {/^[A-Z]{3}$/.test(v) ? v : label(v)}
        </option>
      ))}
    </select>
  );
}

export function SearchBar({ q, placeholder = "Search…", children }: { q?: string; placeholder?: string; children?: React.ReactNode }) {
  return (
    <form className="mb-4 flex flex-wrap gap-2">
      <input name="q" defaultValue={q} placeholder={placeholder} className="input max-w-xs" />
      {children}
      <button className="btn-outline">Filter</button>
    </form>
  );
}

export function DL({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-stone-500">{k}</dt>
          <dd className="font-medium text-stone-900">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
