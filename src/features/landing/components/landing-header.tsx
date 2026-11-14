"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heart, House, ListChecks, Mail, Sparkles } from "lucide-react";
import { LiquidNavbar, type LiquidNavItem } from "@/components/ui/liquid-glass-navbar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useDarkMode } from "@/components/layout/use-dark-mode";
import { NAV_LINKS } from "../content";

const ICON = { size: 18, strokeWidth: 1.8, "aria-hidden": true } as const;

const ITEMS: LiquidNavItem[] = [
  { label: NAV_LINKS[0].label, href: `#${NAV_LINKS[0].id}`, icon: <House {...ICON} />, fx: "glow" },
  {
    label: NAV_LINKS[1].label,
    href: `#${NAV_LINKS[1].id}`,
    icon: <ListChecks {...ICON} />,
    fx: "pop",
  },
  {
    label: NAV_LINKS[2].label,
    href: `#${NAV_LINKS[2].id}`,
    icon: <Sparkles {...ICON} />,
    fx: "spin",
  },
  { label: NAV_LINKS[3].label, href: `#${NAV_LINKS[3].id}`, icon: <Heart {...ICON} />, fx: "drop" },
  { label: NAV_LINKS[4].label, href: `#${NAV_LINKS[4].id}`, icon: <Mail {...ICON} />, fx: "wave" },
];

/** After a click the page scrolls past other sections. Ignore the scroll tracking for this long so the pill does not hop. */
const CLICK_LOCK_MS = 900;

/**
 * Floating header: logo on the left, the liquid navbar in the middle, the account buttons and the theme toggle
 * on the right. It never has a solid bar behind it, so the page shows through. The buttons arrive as `actions`
 * so the server can choose them by sign-in state.
 */
export function LandingHeader({ actions }: { actions: React.ReactNode }) {
  const dark = useDarkMode();
  const [active, setActive] = useState(0);
  const lockedUntil = useRef(0);

  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.getElementById(link.id));
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockedUntil.current) return;
        const visible = entries.find((entry) => entry.isIntersecting);
        const index = NAV_LINKS.findIndex((link) => link.id === visible?.target.id);
        if (index >= 0) setActive(index);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((section) => section && observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function onChange(index: number) {
    lockedUntil.current = Date.now() + CLICK_LOCK_MS;
    setActive(index);
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pt-3 sm:px-4 md:grid-cols-[1fr_auto_1fr] lg:px-12 lg:pt-4">
      <Link
        href="/"
        aria-label="Scroll to Spark home"
        className="pointer-events-auto flex w-fit items-center gap-2.5 rounded-full border border-border bg-surface/80 p-1.5 shadow-card backdrop-blur active:opacity-75 md:pr-4"
      >
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-(image:--gradient-spark) text-lg font-bold text-white"
        >
          S
        </span>
        <span className="hidden text-base font-bold text-ink md:inline">Scroll to Spark</span>
      </Link>

      <LiquidNavbar
        items={ITEMS}
        active={active}
        onChange={onChange}
        tone={dark ? "dark" : "light"}
        className="pointer-events-auto justify-self-center"
      />

      <div className="pointer-events-auto flex items-center justify-self-end gap-2">
        <span className="hidden items-center gap-2 md:flex">{actions}</span>
        <span className="flex rounded-full border border-border bg-surface/80 shadow-card backdrop-blur">
          <ThemeToggle />
        </span>
      </div>
    </header>
  );
}
