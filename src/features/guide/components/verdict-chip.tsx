import { CircleAlert, CircleCheck, CircleHelp, CircleX, type LucideIcon } from "lucide-react";
import type { Verdict } from "./to-message-view";

const ICONS: Record<Verdict, LucideIcon> = {
  supported: CircleCheck,
  partly_supported: CircleAlert,
  unsupported: CircleX,
  not_enough_evidence: CircleHelp,
};

/** The fact check verdict as text plus an icon, so it never relies on color alone. */
export function VerdictChip({ verdict, label }: { verdict: Verdict; label: string }) {
  const Icon = ICONS[verdict];
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-sm font-semibold text-ink">
      <Icon aria-hidden className="size-4" />
      Verdict: {label}
    </span>
  );
}
