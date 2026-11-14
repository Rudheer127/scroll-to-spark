"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessagesSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discussions", label: "Discussions", icon: MessagesSquare },
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
      className="sticky top-0 flex h-screen flex-col gap-1 border-r border-border bg-surface px-3 py-7"
    >
      <Link href="/" className="mb-6 px-3 py-2 text-3xl font-bold">
        <span className="text-brand-gradient">Spark</span>
      </Link>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-4 rounded-xl px-3 py-3 text-base",
              active ? "bg-chip font-bold" : "hover:bg-background",
            )}
          >
            <Icon aria-hidden className="size-6" />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto">{footer}</div>
    </nav>
  );
}
