import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { googleEnabled } from "@/lib/google";
import { GoogleButton, googleErrors } from "@/components/GoogleButton";

export const metadata: Metadata = { title: "Sign In" };

export default async function AccountLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">My account</p>
      <h1 className="mt-1 font-display text-3xl">Sign in</h1>
      <p className="mt-2 text-sm text-stone-600">See your bookings, quotes and invoices in one place.</p>
      <div className="mt-8">
        {error && googleErrors[error] && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{googleErrors[error]}</p>}
        {googleEnabled() && (
          <>
            <GoogleButton type="customer" next={next ?? "/account"} />
            <p className="my-4 text-center text-xs uppercase tracking-wider text-stone-400">or use your email</p>
          </>
        )}
        <LoginForm next={next ?? "/account"} />
      </div>
      <p className="mt-6 text-center text-sm text-stone-600">
        New here? You can{" "}
        <Link href="/account/register" className="font-semibold text-brand-700 underline">
          create an account
        </Link>{" "}
        or simply{" "}
        <Link href="/tours" className="font-semibold text-brand-700 underline">
          book a trip
        </Link>{" "}
        — we&apos;ll set one up for you along the way.
      </p>
    </div>
  );
}
