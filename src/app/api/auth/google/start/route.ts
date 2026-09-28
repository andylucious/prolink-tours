import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { authorizeUrl, googleEnabled, siteOrigin } from "@/lib/google";

export const dynamic = "force-dynamic";

const safePath = (p: string | null, fallback: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : fallback);

// Starts the Google login: remembers who is signing in (client or staff) and sends them to
// Google's "choose an account" screen.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") === "staff" ? "staff" : "customer";
  const home = type === "staff" ? "/admin/login" : "/account/login";
  if (!googleEnabled()) return NextResponse.redirect(`${siteOrigin(req)}${home}?error=google-off`);

  const state = crypto.randomBytes(24).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");
  const next = safePath(url.searchParams.get("next"), type === "staff" ? "/admin" : "/account");

  const res = NextResponse.redirect(authorizeUrl(req, state, nonce));
  res.cookies.set("g_oauth", JSON.stringify({ state, nonce, type, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: siteOrigin(req).startsWith("https://"),
    path: "/api/auth/google",
    maxAge: 600, // 10 minutes to finish choosing an account
  });
  return res;
}
