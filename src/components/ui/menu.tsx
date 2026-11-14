"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type MenuItem = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
};

type MenuProps = { label: string; items: MenuItem[] };

/** A small "more actions" menu. It closes on outside click and on Escape. */
export function Menu({ label, items }: MenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="px-3"
      >
        <MoreHorizontal aria-hidden className="size-5" />
      </Button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          className="absolute right-0 z-10 mt-2 flex min-w-48 flex-col rounded-xl border border-border bg-surface p-1 shadow-lg"
        >
          {items.map(({ label: itemLabel, icon: Icon, onSelect, danger }) => (
            <li key={itemLabel} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSelect();
                }}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold hover:bg-background active:opacity-75",
                  danger ? "text-danger" : "text-ink",
                )}
              >
                {Icon ? <Icon aria-hidden className="size-4" /> : null}
                {itemLabel}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
