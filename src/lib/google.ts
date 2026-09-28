import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

// "Sign in with Google" (OAuth 2.0 authorization-code flow). Needs GOOGLE_CLIENT_ID and
// GOOGLE_CLIENT_SECRET from a Google Cloud OAuth client; until both are set the buttons stay hidden.
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Public origin of this site. SITE_URL wins because behind a proxy the request URL is internal. */
export function siteOrigin(req: Request) {
  return (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
}

export const redirectUri = (req: Request) => `${siteOrigin(req)}/api/auth/google/callback`;

export function authorizeUrl(req: Request, state: string, nonce: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    prompt: "select_account", // always show the "choose an account" screen
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export type GoogleProfile = { email: string; name: string };

/** Trades the one-time code for the user's verified Google identity, or returns null. */
export async function profileFromCode(req: Request, code: string, nonce: string): Promise<GoogleProfile | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(req),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) return null;
  try {
    const { payload } = await jwtVerify(id_token, JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    // Only trust an email Google itself has verified, and only for the login we started.
    if (payload.nonce !== nonce || payload.email_verified !== true || typeof payload.email !== "string") return null;
    return { email: payload.email.toLowerCase(), name: typeof payload.name === "string" ? payload.name : payload.email };
  } catch {
    return null;
  }
}
