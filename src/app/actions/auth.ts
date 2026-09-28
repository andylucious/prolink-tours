"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { parsePermissions } from "@/lib/permissions";
import { str } from "@/lib/form";

/** Wrong passwords allowed in a row before the account is locked. */
const MAX_FAILED_LOGINS = 3;

const LOCKED = "This account is locked after 3 wrong passwords. Ask an admin to unlock it and reset your password.";

export async function login(_: { error?: string } | null, fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const user = await db.user.findUnique({ where: { email } });

  // Same message for "no such account" and "wrong password" so the form can't be used to
  // discover which emails belong to staff.
  if (!user || !user.active) return { error: "Incorrect email or password." };
  if (user.lockedAt) return { error: LOCKED };

  if (!(await bcrypt.compare(password, user.passwordHash))) {
    const failed = user.failedLogins + 1;
    const lock = failed >= MAX_FAILED_LOGINS;
    await db.user.update({ where: { id: user.id }, data: { failedLogins: failed, lockedAt: lock ? new Date() : null } });
    if (lock) return { error: LOCKED };
    const left = MAX_FAILED_LOGINS - failed;
    return { error: `Incorrect email or password. ${left} attempt${left === 1 ? "" : "s"} left before this account is locked.` };
  }

  // A correct password clears the counter.
  if (user.failedLogins) await db.user.update({ where: { id: user.id }, data: { failedLogins: 0 } });

  const token = await signSession({ uid: user.id, name: user.name, role: user.role, permissions: parsePermissions(user.permissions) });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
  const next = str(fd, "next");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
