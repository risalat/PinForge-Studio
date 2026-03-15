"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function DashboardNavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function clearTicker() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function beginProgress() {
      if (activeRef.current) {
        return;
      }

      activeRef.current = true;
      setVisible(true);
      setProgress(14);
      clearTicker();
      intervalRef.current = setInterval(() => {
        setProgress((current) => Math.min(86, current + Math.max(2, (92 - current) * 0.16)));
      }, 120);
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank" || event.metaKey || event.ctrlKey) {
        return;
      }

      if (href.startsWith("/dashboard")) {
        beginProgress();
      }
    }

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      clearTicker();
    };
  }, []);

  useEffect(() => {
    if (!activeRef.current) {
      return;
    }

    activeRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const completeTimeout = setTimeout(() => {
      setProgress(100);
    }, 0);
    const timeout = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);

    return () => {
      clearTimeout(completeTimeout);
      clearTimeout(timeout);
    };
  }, [routeKey]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[95] h-1.5 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full bg-[linear-gradient(90deg,#0d5fff_0%,#41cfff_55%,#87f7ff_100%)] shadow-[0_0_24px_rgba(30,94,255,0.4)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
