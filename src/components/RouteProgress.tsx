"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top-of-page progress bar shown while a click navigates to a new page.
 * Starts the instant an internal link is clicked (so it feels immediate),
 * then completes once the new route's pathname/search params land.
 */
function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const key = `${pathname}?${searchParams?.toString() ?? ""}`;
  const prevKey = useRef(key);

  useEffect(() => {
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (`${url.pathname}${url.search}` === `${window.location.pathname}${window.location.search}`) return;

      clearTimers();
      setVisible(true);
      setPct(15);
      timers.current.push(setTimeout(() => setPct(45), 120));
      timers.current.push(setTimeout(() => setPct(65), 400));
      timers.current.push(setTimeout(() => setPct(80), 900));
      // Safety net: hide even if the route never actually changes (hash link, same page).
      timers.current.push(
        setTimeout(() => {
          setPct(100);
          timers.current.push(setTimeout(() => setVisible(false), 250));
        }, 4000),
      );
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (prevKey.current === key) return;
    prevKey.current = key;
    // Route landed — finish the bar quickly.
    setPct(100);
    const t = setTimeout(() => {
      setVisible(false);
      setPct(0);
    }, 220);
    return () => clearTimeout(t);
  }, [key]);

  return (
    <div className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`} aria-hidden>
      <div
        className="h-full bg-gradient-to-r from-accent-400 via-accent-500 to-brand-600 shadow-[0_0_8px_rgba(224,138,23,0.6)] transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
