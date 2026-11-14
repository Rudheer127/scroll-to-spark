import { ClipboardCheck, History, ShieldCheck, Sprout, type LucideIcon } from "lucide-react";
import { SuggestionPills } from "@/components/ui/suggestion-pills";
import { cn } from "@/lib/cn";
import { STARTER_PROMPTS, type StarterId } from "./chat-input-state";

type StarterPromptsProps = {
  onPick: (message: string) => void;
  disabled: boolean;
  /** The popup: smaller pills, and the mood lead-in on its own line. */
  compact?: boolean;
};

const STARTER_ICONS: Record<StarterId, LucideIcon> = {
  find: Sprout,
  log: ClipboardCheck,
  progress: History,
  claim: ShieldCheck,
};

const TASKS = STARTER_PROMPTS.map((starter) => ({ ...starter, icon: STARTER_ICONS[starter.id] }));

/**
 * The ways to begin under the empty composer: four task pills. Each sends its words as the first
 * message, through the same checks as typed text. Feelings are typed, not picked.
 */
export function StarterPrompts({ onPick, disabled, compact = false }: StarterPromptsProps) {
  const size = compact ? "sm" : "default";
  const pickStarter = (id: string) => {
    const message = STARTER_PROMPTS.find((entry) => entry.id === id)?.message;
    if (message) onPick(message);
  };
  return (
    <div className={cn("flex flex-col items-center", compact ? "gap-3" : "gap-4")}>
      <SuggestionPills
        items={TASKS}
        onSelect={pickStarter}
        disabled={disabled}
        size={size}
        label="Ways to start"
        className="motion-safe:animate-rise motion-safe:[animation-delay:120ms]"
      />
    </div>
  );
}
