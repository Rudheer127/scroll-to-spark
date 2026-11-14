"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { isDarkNow, useDarkMode } from "./use-dark-mode";

const KEY = "theme";

/** Switches between light (the default) and dark, and remembers the choice on this device. */
export function ThemeToggle() {
  const dark = useDarkMode();

  useEffect(() => {
    // Client-side navigation can arrive here without the head script having run, so apply it again.
    try {
      if (localStorage.getItem(KEY) === "dark") document.documentElement.dataset.theme = "dark";
    } catch {
      // Storage can be blocked. The toggle still works for this visit.
    }
  }, []);

  function toggle() {
    const next = isDarkNow() ? "light" : "dark";
    if (next === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Not remembered, but it still applies now.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-ink active:opacity-75"
    >
      {dark ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
    </button>
  );
}
