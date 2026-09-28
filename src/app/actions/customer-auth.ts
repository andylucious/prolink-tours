"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CUSTOMER_SESSION_COOKIE, sessionCookieOptions, signCustomerSession } from "@/lib/session";
import { opt, str } from "@/lib/form";

export type CustomerFormState = { error?: string } | null;

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

async function startSession(id: number, name: string, email: string) {
  const token = await signCustomerSession({ cid: id, name, email });
  (await cookies()).set(CUSTOMER_SESSION_COOKIE, token, sessionCookieOptions);
}

/** Creates a login for a new — or previously staff-created, password-less — customer record. */
export async function registerCustomer(_: CustomerFormState, fd: FormData): Promise<CustomerFormState> {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!name || !emailOk(email)) return { error: "Please enter your name and a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const existing = await db.customer.findUnique({ where: { email } });
  if (existing?.passwordHash) return { error: "An account with this email already exists. Please sign in instead." };

  const passwordHash = await bcrypt.hash(password, 10);
  const customer = existing
    ? await db.customer.update({ where: { id: existing.id }, data: { name, passwordHash, lastLoginAt: new Date() } })
    : await db.customer.create({ data: { name, email, passwordHash, phone: opt(fd, "phone"), lastLoginAt: new Date() } });

  await startSession(customer.id, customer.name, email);
  redirect("/account");
}

export async function loginCustomer(_: CustomerFormState, fd: FormData): Promise<CustomerFormState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const customer = await db.customer.findUnique({ where: { email } });
  if (!customer?.passwordHash || !(await bcrypt.compare(password, customer.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  await db.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
  await startSession(customer.id, customer.name, email);
  const next = str(fd, "next");
  redirect(next.startsWith("/account") ? next : "/account");
}

export async function logoutCustomer() {
  (await cookies()).delete(CUSTOMER_SESSION_COOKIE);
  redirect("/");
}
