import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** True when dark mode is on right now. Reads the same `data-theme` attribute the toggle writes. */
export const isDarkNow = () => document.documentElement.dataset.theme === "dark";

/** Re-renders when dark mode is switched, so anything that needs to know the theme stays in step. */
export function useDarkMode(): boolean {
  return useSyncExternalStore(subscribe, isDarkNow, () => false);
}
