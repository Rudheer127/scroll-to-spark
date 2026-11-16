"use client";

import { History, X } from "lucide-react";

type SearchHistoryProps = {
  /** Newest first. */
  items: string[];
  onPick: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
  label?: string;
};

/** Recent searches as small chips: tap one to search again, x to forget it, Clear to forget all. */
export function SearchHistory({
  items,
  onPick,
  onRemove,
  onClear,
  label = "Recent searches",
}: SearchHistoryProps) {
  if (items.length === 0) return null;
  return (
    <section aria-label={label} className="flex flex-wrap items-center gap-2 px-2 text-sm">
      <History aria-hidden className="size-4 text-muted" />
      <span className="font-semibold text-muted">{label}</span>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((term) => (
          <li
            key={term}
            className="flex items-center overflow-hidden rounded-full bg-chip text-sm font-semibold"
          >
            <button
              type="button"
              onClick={() => onPick(term)}
              className="min-h-8 py-1 pl-3 pr-1.5 hover:underline"
            >
              {term}
            </button>
            <button
              type="button"
              onClick={() => onRemove(term)}
              aria-label={`Forget ${term}`}
              className="flex min-h-8 items-center px-2 text-muted hover:text-ink"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClear} className="font-semibold text-action hover:underline">
        Clear
      </button>
    </section>
  );
}
