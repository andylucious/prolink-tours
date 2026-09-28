import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/upload";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = path.basename((await params).name); // no path traversal
  const ext = name.split(".").pop() ?? "";
  if (!TYPES[ext]) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), { headers: { "Content-Type": TYPES[ext], "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
