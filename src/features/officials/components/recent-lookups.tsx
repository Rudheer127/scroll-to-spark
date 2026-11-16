"use client";

import { History, X } from "lucide-react";
import type { RecentLookup } from "@/features/officials/types";

/** Recent ZIP lookups as chips: tap one to look it up again, x to forget it, Clear history to forget all. */
export function RecentLookups({
  items,
  onPick,
  onRemove,
  onClear,
}: {
  items: RecentLookup[];
  onPick: (zip: string) => void;
  onRemove: (zip: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Recent lookups" className="flex flex-wrap items-center gap-2 px-2 text-sm">
      <History aria-hidden className="size-4 text-muted" />
      <span className="font-semibold text-muted">Recent lookups</span>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item.zip}
            className="flex items-center overflow-hidden rounded-full bg-chip text-sm font-semibold"
          >
            <button
              type="button"
              onClick={() => onPick(item.zip)}
              className="min-h-8 py-1 pl-3 pr-1.5 hover:underline"
            >
              {item.zip} · {item.city}, {item.state}
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.zip)}
              aria-label={`Forget ${item.zip}`}
              className="flex min-h-8 items-center px-2 text-muted hover:text-ink"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClear} className="font-semibold text-action hover:underline">
        Clear history
      </button>
    </section>
  );
}
