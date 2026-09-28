import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, CUSTOMER_SESSION_COOKIE, verifyCustomerSession } from "@/lib/session";
import { can, type Permission } from "@/lib/permissions";

// Every gated /admin section, so this can redirect BEFORE any page starts rendering — a check
// made later inside a nested layout runs too late, since Next.js may already have streamed
// that page's data to the client by the time a Server Component's redirect() takes effect.
const SECTION_PERMISSION: [string, Permission][] = [
  ["/admin/inquiries", "sales"],
  ["/admin/customers", "sales"],
  ["/admin/quotes", "sales"],
  ["/admin/bookings", "operations"],
  ["/admin/suppliers", "operations"],
  ["/admin/invoices", "finance"],
  ["/admin/payments", "finance"],
  ["/admin/supplier-payments", "finance"],
  ["/admin/tours", "website"],
  ["/admin/catalog", "website"],
  ["/admin/blog", "website"],
  ["/admin/messages", "website"],
  ["/admin/reports", "reports"],
  // Standalone printable documents live under their own /admin/print/* paths, so they need
  // their own entries here — they aren't nested under the sections above.
  ["/admin/print/quote", "sales"],
  ["/admin/print/invoice", "finance"],
  ["/admin/print/voucher", "operations"],
  ["/admin/print/booking", "operations"],
  ["/admin/print/report", "reports"],
];

async function guard(req: NextRequest, cookieName: string, verify: (t?: string) => Promise<unknown>, loginPath: string) {
  const session = await verify(req.cookies.get(cookieName)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = loginPath;
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return session;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const result = await guard(req, SESSION_COOKIE, verifySession, "/admin/login");
    if (result instanceof NextResponse) return result;

    const session = result as { role: "ADMIN" | "STAFF"; permissions?: Permission[] };
    if (session.role !== "ADMIN") {
      const match = SECTION_PERMISSION.find(([prefix]) => pathname.startsWith(prefix));
      if (match && !can(session, match[1])) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin";
        url.search = "?denied=1";
        return NextResponse.redirect(url);
      }
      // Users & settings are admin-only, and users/[id]-style admin-only pages check role
      // themselves — this only needs to cover the section list above.
      if (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/settings")) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin";
        url.search = "?denied=1";
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    if (pathname === "/account/login" || pathname === "/account/register") return NextResponse.next();
    const result = await guard(req, CUSTOMER_SESSION_COOKIE, verifyCustomerSession, "/account/login");
    return result instanceof NextResponse ? result : NextResponse.next();
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
