"use client";

import { useActionState } from "react";
import { submitContact, type FormState } from "@/app/actions/public";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, null);
  if (state?.ok)
    return (
      <div className="rounded-2xl bg-brand-50 p-8 text-center">
        <p className="font-display text-2xl text-brand-800">Message sent — thank you!</p>
        <p className="mt-2 text-stone-600">We&apos;ll get back to you shortly.</p>
      </div>
    );
  return (
    <form action={action} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">
            Name *
          </label>
          <input id="c-name" name="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">
            Email *
          </label>
          <input id="c-email" type="email" name="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="c-phone">
            Phone
          </label>
          <input id="c-phone" name="phone" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="c-subject">
            Subject
          </label>
          <input id="c-subject" name="subject" className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-message">
          Message *
        </label>
        <textarea id="c-message" name="message" rows={5} required className="input" />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary">
        {pending && <span className="spinner" />}
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
