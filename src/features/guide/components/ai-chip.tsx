import { Bot } from "lucide-react";

/** Says the guide is AI wherever it appears. */
export function AiChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-0.5 text-xs font-semibold text-ink">
      <Bot aria-hidden className="size-3.5" />
      AI
    </span>
  );
}
