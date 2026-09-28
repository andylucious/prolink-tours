import { LoginForm } from "./LoginForm";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Staff login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, s] = await Promise.all([searchParams, getSettings()]);
  return (
    <div className="grid min-h-screen place-items-center bg-brand-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-500 text-2xl text-white">◭</span>
          <p className="mt-3 font-display text-2xl text-white">{s.companyName}</p>
          <p className="text-sm text-brand-200">Back-office ERP</p>
        </div>
        <LoginForm next={next ?? "/admin"} />
      </div>
    </div>
  );
}
