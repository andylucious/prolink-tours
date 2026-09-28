import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { googleEnabled } from "@/lib/google";
import { GoogleButton } from "@/components/GoogleButton";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">My account</p>
      <h1 className="mt-1 font-display text-3xl">Create your account</h1>
      <p className="mt-2 text-sm text-stone-600">Track inquiries, quotes, bookings and invoices in one place.</p>
      <div className="mt-8">
        {googleEnabled() && (
          <>
            <GoogleButton type="customer" label="Sign up with Google" />
            <p className="my-4 text-center text-xs uppercase tracking-wider text-stone-400">or use your email</p>
          </>
        )}
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/account/login" className="font-semibold text-brand-700 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
