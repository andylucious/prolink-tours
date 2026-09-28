import { LoginForm } from "./LoginForm";
import { getSettings } from "@/lib/settings";
import { googleEnabled } from "@/lib/google";
import { GoogleButton, googleErrors } from "@/components/GoogleButton";

export const metadata = { title: "Staff login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const [{ next, error }, s] = await Promise.all([searchParams, getSettings()]);
  return (
    <div className="grid min-h-screen place-items-center bg-brand-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-500 text-2xl text-white">◭</span>
          <p className="mt-3 font-display text-2xl text-white">{s.companyName}</p>
          <p className="text-sm text-brand-200">Back-office ERP</p>
        </div>
        {error && googleErrors[error] && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{googleErrors[error]}</p>}
        <LoginForm next={next ?? "/admin"} />
        {googleEnabled() && (
          <div className="mt-4">
            <p className="mb-3 text-center text-xs uppercase tracking-wider text-brand-200">or</p>
            <GoogleButton type="staff" next={next ?? "/admin"} label="Sign in with Google" />
          </div>
        )}
      </div>
    </div>
  );
}
