"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { NAV_LINKS } from "../content";

/** Sticky top bar. Highlights the section you are reading. The buttons come in as `actions` so the server can choose them by sign-in state. */
export function LandingNav({ actions }: { actions: React.ReactNode }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.getElementById(link.id)).filter(
      (node): node is HTMLElement => node !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 text-background backdrop-blur">
      <div className="flex items-center justify-between gap-6 px-6 py-3 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 active:opacity-75">
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-full bg-(image:--gradient-spark) text-lg font-bold text-white"
          >
            S
          </span>
          <span className="text-xl font-bold">Scroll to Spark</span>
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-(--radius-control) px-4 text-sm font-semibold transition-colors hover:bg-white/10",
                active === link.id && "bg-white/15 text-sun",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
