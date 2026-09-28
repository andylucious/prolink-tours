"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { parsePermissions } from "@/lib/permissions";
import { str } from "@/lib/form";

export async function login(_: { error?: string } | null, fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  const token = await signSession({ uid: user.id, name: user.name, role: user.role, permissions: parsePermissions(user.permissions) });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
  const next = str(fd, "next");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
