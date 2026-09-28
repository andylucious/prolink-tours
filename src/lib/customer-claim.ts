import "server-only";
import { db } from "./db";

export const CLAIM_BLOCKED =
  "This email is already on file with us. Please sign in with Google using that email, or contact us and we'll set up your access.";

/**
 * Typing an email + a new password into "register" would otherwise let anyone take over an
 * existing client record (with its bookings and invoices) without proving they own the email.
 * So a password can only be attached to a record that is still empty: no inquiries, quotes,
 * bookings or invoices, and nobody has signed into it yet (e.g. via Google). Anyone else
 * proves ownership by signing in with Google, which verifies the email.
 */
export async function canClaimWithPassword(customerId: number) {
  const c = await db.customer.findUnique({
    where: { id: customerId },
    select: { lastLoginAt: true, _count: { select: { inquiries: true, quotes: true, bookings: true, invoices: true } } },
  });
  if (!c) return false;
  const n = c._count;
  return !c.lastLoginAt && n.inquiries + n.quotes + n.bookings + n.invoices === 0;
}
