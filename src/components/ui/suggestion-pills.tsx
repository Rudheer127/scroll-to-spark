import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type SuggestionPill = { id: string; label: string; icon?: LucideIcon };

type SuggestionPillsProps = {
  items: readonly SuggestionPill[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  /** "quiet" is smaller and muted, for a second row that should not compete with the first. */
  tone?: "default" | "quiet";
  /** "sm" fits a narrow panel, such as a popup. Still 44px tall on small screens. */
  size?: "default" | "sm";
  /** Names the list for screen readers, either directly or through a visible lead-in. */
  label?: string;
  labelledBy?: string;
  className?: string;
};

const TONE = {
  default: "border-border bg-surface font-medium text-ink hover:bg-chip",
  quiet: "border-transparent text-muted hover:bg-chip hover:text-ink",
} as const;

const SIZE = {
  default: "gap-2 px-4 text-sm md:min-h-9",
  sm: "gap-1.5 px-3 text-[0.8125rem] md:min-h-8",
} as const;

/** A wrapped row of small rounded buttons, each an optional icon and a short label. */
export function SuggestionPills({
  items,
  onSelect,
  disabled = false,
  tone = "default",
  size = "default",
  label,
  labelledBy,
  className,
}: SuggestionPillsProps) {
  return (
    <ul
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cn("flex flex-wrap justify-center gap-2", className)}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item.id)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border transition-colors active:opacity-75 disabled:cursor-not-allowed disabled:opacity-50",
                TONE[tone],
                SIZE[size],
              )}
            >
              {Icon ? (
                <Icon
                  aria-hidden
                  className={cn("shrink-0 text-muted", size === "sm" ? "size-3.5" : "size-4")}
                />
              ) : null}
              {item.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
