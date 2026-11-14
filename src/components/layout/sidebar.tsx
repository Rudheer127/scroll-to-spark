"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, MessagesSquare, Sprout, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/steps", label: "My steps", icon: Sprout },
  { href: "/discussions", label: "Discussions", icon: MessagesSquare },
  { href: "/portal", label: "Partner portal", icon: Building2 },
  { href: "/profile", label: "Profile", icon: User },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Left navigation rail. Only links to screens that exist. The footer slot holds the account block. */
export function Sidebar({ footer }: { footer: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 flex h-screen flex-col gap-2 border-r border-border bg-surface p-6"
    >
      <Link href="/" className="mb-4 flex items-center gap-2.5 active:opacity-75">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-sun font-display text-xl font-bold"
        >
          S
        </span>
        <span className="font-display text-2xl font-bold">Spark</span>
      </Link>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold active:opacity-75",
              active ? "bg-coral text-white" : "hover:bg-chip",
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
