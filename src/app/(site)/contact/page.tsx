import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const s = await getSettings();
  const wa = `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Contact</p>
      <h1 className="mt-1 font-display text-4xl">We&apos;d love to hear from you</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-4">
          {[
            ["Phone", s.phone, `tel:${s.phone.replace(/\s/g, "")}`],
            ["Email", s.email, `mailto:${s.email}`],
            ["Office", s.address, null],
          ].map(([l, v, href]) => (
            <div key={l} className="card p-5">
              <p className="label">{l}</p>
              {href ? (
                <a href={href} className="font-semibold text-brand-700 hover:underline">
                  {v}
                </a>
              ) : (
                <p className="font-semibold">{v}</p>
              )}
            </div>
          ))}
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] py-3 text-base text-white hover:bg-[#1fb857]">
            Chat instantly on WhatsApp
          </a>
        </div>
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
