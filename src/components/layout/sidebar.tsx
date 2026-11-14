"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  MessagesSquare,
  Sparkles,
  Sprout,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; short: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", short: "Home", icon: Home },
  { href: "/steps", label: "My steps", short: "Steps", icon: Sprout },
  { href: "/discussions", label: "Discussions", short: "Groups", icon: MessagesSquare },
  { href: "/guide", label: "Guide", short: "Guide", icon: Sparkles },
  { href: "/portal", label: "Partner portal", short: "Portal", icon: Building2 },
  { href: "/profile", label: "Profile", short: "Profile", icon: User },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Left navigation rail. Only links to screens that exist. The footer slot holds the account block. */
export function Sidebar({ footer }: { footer: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-screen flex-col lg:flex gap-2 border-r border-border bg-surface p-6"
    >
      <div className="mb-4 flex items-center">
        <Link href="/" className="flex items-center gap-2.5 active:opacity-75">
          <span className="bg-(image:--gradient-spark) bg-clip-text font-display text-3xl font-extrabold tracking-tight text-transparent">
            Spark
          </span>
        </Link>
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-[0.9375rem] font-semibold transition-colors active:opacity-75",
              active ? "bg-chip font-extrabold" : "text-ink/80 hover:bg-chip/70",
            )}
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto">{footer}</div>
    </nav>
  );
}
