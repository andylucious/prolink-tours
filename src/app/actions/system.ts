"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { bool, int, str } from "@/lib/form";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { imageFrom } from "@/lib/upload";

// ───────── Settings ─────────

export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const keys = Object.keys(DEFAULT_SETTINGS);
  // The logo can come from an uploaded file (logoFile) or a pasted URL (logo) — imageFrom()
  // prefers the upload and falls back to the URL, same as tour/blog cover images.
  const logo = await imageFrom(fd, "logoFile", "logo");
  await db.$transaction(
    keys.map((key) => {
      const value = key === "logo" ? logo ?? "" : String(fd.get(key) ?? "").trim();
      return db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    }),
  );
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

// ───────── Users ─────────

export async function saveUser(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  const password = str(fd, "password");
  const permissions = ALL_PERMISSIONS.filter((p) => fd.getAll("permissions").includes(p));
  const data = {
    name: str(fd, "name"),
    email: str(fd, "email").toLowerCase(),
    role: (str(fd, "role") || "STAFF") as Role,
    active: bool(fd, "active"),
    permissions,
  };
  if (id) {
    // Setting a new password also clears any lock-out, so "reset password" is all an admin needs.
    await db.user.update({
      where: { id },
      data: { ...data, ...(password ? { passwordHash: await bcrypt.hash(password, 10), failedLogins: 0, lockedAt: null } : {}) },
    });
  } else {
    if (password.length < 6) redirect("/admin/users?error=password");
    await db.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 10) } });
  }
  redirect("/admin/users");
}

/** Lets a locked-out staff member try again with their current password. */
export async function unlockUser(id: number) {
  await requireAdmin();
  await db.user.update({ where: { id }, data: { failedLogins: 0, lockedAt: null } });
  redirect("/admin/users?saved=unlocked");
}

export async function changeOwnPassword(fd: FormData) {
  const session = await requireUser();
  const current = str(fd, "current");
  const next = str(fd, "next");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.uid } });
  if (!(await bcrypt.compare(current, user.passwordHash)) || next.length < 6) redirect("/admin/users?error=pw");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  redirect("/admin/users?saved=pw");
}

// ───────── Contact messages ─────────

export async function toggleMessageRead(id: number) {
  await requireUser();
  const m = await db.contactMessage.findUniqueOrThrow({ where: { id } });
  await db.contactMessage.update({ where: { id }, data: { read: !m.read } });
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(id: number) {
  await requireUser();
  await db.contactMessage.delete({ where: { id } });
  revalidatePath("/admin", "layout");
}
