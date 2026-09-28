"use client";

import { useActionState } from "react";
import { registerCustomer } from "@/app/actions/customer-auth";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerCustomer, null);
  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="name">
          Full name
        </label>
        <input id="name" name="name" required autoComplete="name" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="phone">
          Phone (optional)
        </label>
        <input id="phone" name="phone" autoComplete="tel" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className="input" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending && <span className="spinner" />}
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
