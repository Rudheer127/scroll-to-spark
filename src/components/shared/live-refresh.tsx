"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 12_000;

/**
 * Keeps what you see current as other people add to it. While the tab is visible it re-reads the
 * page's data every few seconds and when you come back to the tab, so nobody has to hard refresh.
 * It skips the refresh while you are typing so a half-written comment is never lost.
 */
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    function typing() {
      const el = document.activeElement;
      return el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement;
    }
    function refresh() {
      if (document.visibilityState === "visible" && !typing()) router.refresh();
    }
    const timer = window.setInterval(refresh, INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);

  return null;
}
