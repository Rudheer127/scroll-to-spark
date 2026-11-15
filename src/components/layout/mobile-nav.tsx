"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TAB_BAR_ITEMS, isActive } from "@/components/layout/nav-items";
import { cn } from "@/lib/cn";

/**
 * Navigation for windows narrower than the large breakpoint: a bar pinned to the bottom edge.
 * Six equal columns keep every target at least 44px wide at 320px; Settings is in the account menu.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-6">
        {TAB_BAR_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 text-[0.6875rem] font-semibold tracking-tight active:opacity-75",
                  active ? "text-ink" : "text-muted",
                )}
              >
                <Icon aria-hidden className={cn("size-5", active && "stroke-[2.5]")} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
