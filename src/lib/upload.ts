import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MAX_BYTES = 8 * 1024 * 1024;

/** Saves an uploaded image and returns its public URL, or null if no file was sent. */
export async function saveUpload(file: FormDataEntryValue | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Only JPG, PNG, WEBP, GIF or AVIF images are allowed.");
  if (file.size > MAX_BYTES) throw new Error("Image is larger than 8 MB.");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** Prefer an uploaded file; fall back to a pasted URL field. */
export async function imageFrom(fd: FormData, fileKey: string, urlKey: string) {
  const uploaded = await saveUpload(fd.get(fileKey));
  if (uploaded) return uploaded;
  const url = String(fd.get(urlKey) ?? "").trim();
  return url || null;
}
