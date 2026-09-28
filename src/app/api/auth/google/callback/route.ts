import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profileFromCode, siteOrigin } from "@/lib/google";
import { parsePermissions } from "@/lib/permissions";
import {
  CUSTOMER_SESSION_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
  signCustomerSession,
  signSession,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = siteOrigin(req);
  const url = new URL(req.url);
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)g_oauth=([^;]+)/)?.[1];
  let saved: { state: string; nonce: string; type: "staff" | "customer"; next: string } | null = null;
  try {
    saved = cookie ? JSON.parse(decodeURIComponent(cookie)) : null;
  } catch {
    saved = null;
  }

  const home = saved?.type === "staff" ? "/admin/login" : "/account/login";
  const fail = (code: string) => {
    const res = NextResponse.redirect(`${origin}${home}?error=${code}`);
    res.cookies.delete({ name: "g_oauth", path: "/api/auth/google" });
    return res;
  };

  const code = url.searchParams.get("code");
  // No code = the person cancelled on Google's screen. A state mismatch = not a login we started.
  if (!saved || !code || url.searchParams.get("state") !== saved.state) return fail("google-cancelled");

  const profile = await profileFromCode(req, code, saved.nonce);
  if (!profile) return fail("google");

  const res = NextResponse.redirect(`${origin}${saved.next}`);

  if (saved.type === "staff") {
    // Staff are never created from a Google login — the address must already belong to an
    // active staff account that an admin set up.
    const user = await db.user.findUnique({ where: { email: profile.email } });
    if (!user || !user.active) return fail("google-not-staff");
    // A locked account stays locked whichever way you try to get in.
    if (user.lockedAt) return fail("google-locked");
    const token = await signSession({ uid: user.id, name: user.name, role: user.role, permissions: parsePermissions(user.permissions) });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  } else {
    // Google has verified this email, so it's safe to sign into (or create) the customer record.
    const existing = await db.customer.findUnique({ where: { email: profile.email } });
    const customer = existing
      ? await db.customer.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } })
      : await db.customer.create({ data: { name: profile.name, email: profile.email, lastLoginAt: new Date() } });
    const token = await signCustomerSession({ cid: customer.id, name: customer.name, email: profile.email });
    res.cookies.set(CUSTOMER_SESSION_COOKIE, token, sessionCookieOptions);
  }

  res.cookies.delete({ name: "g_oauth", path: "/api/auth/google" });
  return res;
}
