"use client";

import { useActionState } from "react";
import { loginCustomer } from "@/app/actions/customer-auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginCustomer, null);
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending && <span className="spinner" />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
