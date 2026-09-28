import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { RouteProgress } from "@/components/RouteProgress";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

// Everything reads live data from MySQL, so render on each request.
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.companyName} — Safaris, Beach & Sports Tours`, template: `%s | ${s.companyName}` },
    description: s.tagline,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased`}>
        <RouteProgress />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
