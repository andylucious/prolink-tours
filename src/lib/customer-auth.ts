import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSession } from "./session";
import { db } from "./db";

export async function getCustomerSession() {
  const store = await cookies();
  return verifyCustomerSession(store.get(CUSTOMER_SESSION_COOKIE)?.value);
}

/** The logged-in customer's own record, or null. Redirects nowhere — callers decide. */
export async function getCurrentCustomer() {
  const session = await getCustomerSession();
  if (!session) return null;
  return db.customer.findUnique({ where: { id: session.cid } });
}

export async function requireCustomer() {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");
  return session;
}
