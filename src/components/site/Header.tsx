import Link from "next/link";

const nav = [
  { href: "/tours", label: "Tours" },
  { href: "/about", label: "About Us" },
  { href: "/blog", label: "Travel Guides" },
  { href: "/contact", label: "Contact" },
];

export function Header({ companyName, customerName }: { companyName: string; customerName?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-lg text-white">◭</span>
          <span className="font-display text-lg font-semibold leading-tight text-brand-900">{companyName}</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-stone-700 hover:text-brand-700">
              {n.label}
            </Link>
          ))}
          <Link href={customerName ? "/account" : "/account/login"} className="text-sm font-medium text-stone-700 hover:text-brand-700">
            {customerName ? `Hi, ${customerName.split(" ")[0]}` : "Sign in"}
          </Link>
          <Link href="/inquire" className="btn-accent">
            Get a Quote
          </Link>
        </nav>
        <details className="relative md:hidden">
          <summary className="list-none rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium">Menu</summary>
          <div className="absolute right-0 mt-2 w-52 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-sand-100">
                {n.label}
              </Link>
            ))}
            <Link href={customerName ? "/account" : "/account/login"} className="block rounded-lg px-3 py-2 text-sm hover:bg-sand-100">
              {customerName ? `My account (${customerName.split(" ")[0]})` : "Sign in / My account"}
            </Link>
            <Link href="/inquire" className="btn-accent mt-2 w-full">
              Get a Quote
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
