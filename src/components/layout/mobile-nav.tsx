"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/components/layout/sidebar";
import { cn } from "@/lib/cn";

/** Navigation for windows narrower than the large breakpoint: a bar pinned to the bottom edge. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-6">
        {NAV_ITEMS.map(({ href, short, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold active:opacity-75",
                  active ? "text-ink" : "text-muted",
                )}
              >
                <Icon aria-hidden className={cn("size-5", active && "stroke-[2.5]")} />
                {short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
