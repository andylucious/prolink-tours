"use client";

import { usePathname } from "next/navigation";

/**
 * Fades + slides each new page in on arrival, keyed by pathname so React
 * remounts (and re-plays the animation) every time the route changes.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
}
