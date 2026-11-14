"use client";

import { usePathname } from "next/navigation";
import { SidebarPanel } from "./sidebar-panel";
import { useSidebar } from "./use-sidebar";

type SidebarProps = {
  /** The recent guide chats, rendered on the server inside Suspense. */
  chats: React.ReactNode;
  /** The account row. */
  footer: React.ReactNode;
};

/**
 * The left navigation for large screens. It can be pinned open or collapsed to an icon rail; a
 * collapsed rail opens over the page on hover or keyboard focus without moving the page, because
 * the grid column keeps the collapsed width and the panel floats above it.
 */
export function Sidebar({ chats, footer }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, overlay, dispatch, toggle } = useSidebar();

  return (
    <div className="sticky top-0 z-30 hidden h-screen lg:block">
      <SidebarPanel
        pathname={pathname}
        collapsed={collapsed}
        overlay={overlay}
        onToggle={toggle}
        onOpenChats={() => dispatch({ type: "open-now" })}
        chats={chats}
        footer={footer}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") dispatch({ type: "pointer-enter" });
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "mouse") return;
          dispatch({ type: "pointer-leave" });
          // A focused element that was removed (a closed dialog) never fires blur, so check here.
          if (!event.currentTarget.contains(document.activeElement)) {
            dispatch({ type: "focus-out" });
          }
        }}
        onFocus={(event) => {
          // Only keyboard focus opens the rail; a click keeps the hover rules.
          if (event.target.matches(":focus-visible")) dispatch({ type: "focus-in" });
        }}
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
            dispatch({ type: "focus-out" });
          }
        }}
      />
    </div>
  );
}
