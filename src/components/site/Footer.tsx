import Link from "next/link";
import type { Settings } from "@/lib/settings";

export function Footer({ s, categories }: { s: Settings; categories: { name: string; slug: string }[] }) {
  return (
    <footer className="mt-24 bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl text-white">{s.companyName}</p>
          <p className="mt-3 max-w-md text-sm text-brand-200">{s.tagline}</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent-400">Explore</p>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/tours?category=${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog" className="hover:text-white">
                Travel Guides
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent-400">Contact</p>
          <ul className="space-y-2 text-sm">
            <li>{s.address}</li>
            <li>
              <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-white">
                {s.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${s.email}`} className="hover:text-white">
                {s.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-800 py-5 text-center text-xs text-brand-200">
        © {new Date().getFullYear()} {s.companyName}. All rights reserved. ·{" "}
        <Link href="/admin" className="hover:text-white">
          Staff login
        </Link>
      </div>
    </footer>
  );
}
