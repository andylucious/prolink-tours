// Edge-safe session helpers (used by middleware and server code).
// Two independent sessions live side by side: staff (back office) and customer (self-service).
import { SignJWT, jwtVerify } from "jose";
import type { Permission } from "./permissions";

const MAX_AGE = 60 * 60 * 12; // 12 hours

export const SESSION_COOKIE = "erp_session";
// Permissions are embedded here (set at login) so middleware can enforce section access on the
// Edge, before any page starts rendering or streaming — a check made later, inside a nested
// Server Component layout, runs too late: Next.js may already have streamed the parent layout's
// HTML (and, via prefetch/RSC data, page content) to the client by the time that redirect fires.
// The cost is that a rights change by an admin takes effect on the staff member's next login
// rather than immediately; see requirePermission() in auth.ts, which re-checks the database and
// covers that gap for anyone still refreshing pages within an old session.
export type SessionPayload = { uid: number; name: string; role: "ADMIN" | "STAFF"; permissions?: Permission[] };

export const CUSTOMER_SESSION_COOKIE = "erp_customer";
export type CustomerSessionPayload = { cid: number; name: string; email: string };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function sign(payload: Record<string, unknown>) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
}

async function verify<T>(token?: string): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export const signSession = (payload: SessionPayload) => sign(payload);
export const verifySession = (token?: string) => verify<SessionPayload>(token);

export const signCustomerSession = (payload: CustomerSessionPayload) => sign(payload);
export const verifyCustomerSession = (token?: string) => verify<CustomerSessionPayload>(token);

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  // HTTPS-only cookie when the site is served over https; plain http (LAN IP) still works.
  secure: (process.env.SITE_URL ?? "").startsWith("https://"),
  path: "/",
  maxAge: MAX_AGE,
};
