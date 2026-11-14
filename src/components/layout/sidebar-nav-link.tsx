import Link from "next/link";
import { cn } from "@/lib/cn";
import type { NavItem } from "./nav-items";

/**
 * One navigation item: the icon in a 44px target, the name beside it. The name also sits on the
 * link (aria-label and title), so the collapsed rail, which shows only icons, still says where
 * each link goes.
 */
export function SidebarNavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      title={item.label}
      className={cn(
        "flex h-11 shrink-0 items-center gap-3 overflow-hidden rounded-xl px-3.5 text-[0.9375rem] font-semibold transition-colors active:opacity-75",
        active ? "bg-chip font-extrabold" : "text-ink/80 hover:bg-chip/70",
      )}
    >
      <Icon aria-hidden className={cn("size-5 shrink-0", active && "stroke-[2.5]")} />
      <span data-sidebar-label aria-hidden className="truncate">
        {item.label}
      </span>
    </Link>
  );
}
