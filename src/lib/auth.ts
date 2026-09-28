import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "./session";
import { db } from "./db";
import { can, parsePermissions, type Permission } from "./permissions";

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.role !== "ADMIN") redirect("/admin?denied=1");
  return session;
}

/** Fresh from the database, never from the session cookie, so a rights change applies at once. */
export async function getPermissions(uid: number): Promise<Permission[]> {
  const user = await db.user.findUnique({ where: { id: uid }, select: { permissions: true } });
  return parsePermissions(user?.permissions);
}

/** Restricts a whole section (and everything nested under it) to staff with that permission. */
export async function requirePermission(permission: Permission) {
  const session = await requireUser();
  if (session.role !== "ADMIN") {
    const permissions = await getPermissions(session.uid);
    if (!can({ role: session.role, permissions }, permission)) redirect("/admin?denied=1");
  }
  return session;
}
