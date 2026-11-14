import Link from "next/link";
import { History } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { isActive, NAV_ITEMS } from "./nav-items";
import { SidebarNavLink } from "./sidebar-nav-link";
import { SidebarToggle } from "./sidebar-toggle";

export type SidebarPanelProps = {
  pathname: string;
  collapsed: boolean;
  /** A collapsed rail opened by hover or focus, floating over the page. */
  overlay: boolean;
  onToggle: () => void;
  /** Opens a collapsed rail at once, from its chat history icon. */
  onOpenChats: () => void;
  /** The recent chats, shown only while the rail is open. */
  chats: React.ReactNode;
  /** The account row. */
  footer: React.ReactNode;
} & Pick<React.ComponentProps<"nav">, "onPointerEnter" | "onPointerLeave" | "onFocus" | "onBlur">;

/**
 * What the sidebar draws. Which parts show while collapsed is decided in CSS (globals.css, the
 * data-sidebar rules), keyed on the attribute the head script sets before first paint, so the
 * first frame is already right. The props only add the overlay and the toggle's label.
 */
export function SidebarPanel({
  pathname,
  collapsed,
  overlay,
  onToggle,
  onOpenChats,
  chats,
  footer,
  ...handlers
}: SidebarPanelProps) {
  return (
    <nav
      aria-label="Main"
      data-sidebar-panel
      data-state={collapsed ? "collapsed" : "expanded"}
      data-overlay={overlay ? "open" : "closed"}
      className="absolute inset-y-0 left-0 z-30 flex flex-col gap-1 overflow-hidden border-r border-border bg-surface px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      {...handlers}
    >
      <div
        data-sidebar-header
        className="mb-3 flex h-11 shrink-0 items-center justify-between gap-2"
      >
        <Link href="/" data-sidebar-expanded-only className="pl-2.5 active:opacity-75">
          <span className="bg-(image:--gradient-spark) bg-clip-text font-display text-3xl font-extrabold tracking-tight text-transparent">
            Spark
          </span>
        </Link>
        <SidebarToggle collapsed={collapsed} onToggle={onToggle} />
      </div>
      {NAV_ITEMS.map((item) => (
        <SidebarNavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
      ))}
      <div
        data-sidebar-collapsed-only
        className="mt-2 flex shrink-0 justify-center border-t border-border pt-3"
      >
        <IconButton label="Show chats" title="Chats" onClick={onOpenChats} className="md:size-11">
          <History aria-hidden className="size-5" />
        </IconButton>
      </div>
      <div
        data-sidebar-expanded-only
        className="mt-3 flex min-h-0 flex-1 flex-col border-t border-border pt-3"
      >
        {chats}
      </div>
      <div className="mt-auto shrink-0 pt-3">{footer}</div>
    </nav>
  );
}
