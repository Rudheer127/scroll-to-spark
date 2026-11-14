"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.dataset.theme === "dark";

/** Switches between light (the default) and dark, and remembers the choice on this device. */
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  useEffect(() => {
    // Client-side navigation can arrive here without the head script having run, so apply it again.
    try {
      if (localStorage.getItem(KEY) === "dark") document.documentElement.dataset.theme = "dark";
    } catch {
      // Storage can be blocked. The toggle still works for this visit.
    }
    // The landing page is always light, so leave dark behind when leaving the app.
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, []);

  function toggle() {
    const next = isDark() ? "light" : "dark";
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
