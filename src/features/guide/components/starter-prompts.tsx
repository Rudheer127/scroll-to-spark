import { useId } from "react";
import { ClipboardCheck, History, ShieldCheck, Sprout, type LucideIcon } from "lucide-react";
import { SuggestionPills } from "@/components/ui/suggestion-pills";
import { cn } from "@/lib/cn";
import { MOODS } from "../moods";
import { STARTER_PROMPTS, type StarterId } from "./chat-input-state";
import { MOOD_LEAD } from "./guide-copy";

type StarterPromptsProps = {
  onPick: (message: string) => void;
  disabled: boolean;
  /** The popup: smaller pills, and the mood lead-in on its own line. */
  compact?: boolean;
};
type Startable = readonly { id: string; message: string }[];

const STARTER_ICONS: Record<StarterId, LucideIcon> = {
  find: Sprout,
  log: ClipboardCheck,
  progress: History,
  claim: ShieldCheck,
};

const TASKS = STARTER_PROMPTS.map((starter) => ({ ...starter, icon: STARTER_ICONS[starter.id] }));

/**
 * The ways to begin under the empty composer: four task pills, then a quieter row of moods.
 * Each sends its words as the first message, through the same checks as typed text.
 */
export function StarterPrompts({ onPick, disabled, compact = false }: StarterPromptsProps) {
  const size = compact ? "sm" : "default";
  const moodLeadId = useId();
  const pickFrom = (list: Startable) => (id: string) => {
    const message = list.find((entry) => entry.id === id)?.message;
    if (message) onPick(message);
  };
  return (
    <div className={cn("flex flex-col items-center", compact ? "gap-3" : "gap-4")}>
      <SuggestionPills
        items={TASKS}
        onSelect={pickFrom(STARTER_PROMPTS)}
        disabled={disabled}
        size={size}
        label="Ways to start"
        className="motion-safe:animate-rise motion-safe:[animation-delay:120ms]"
      />
      <div
        className={cn(
          "flex items-center justify-center gap-1 motion-safe:animate-rise motion-safe:[animation-delay:180ms]",
          compact ? "flex-col" : "flex-wrap",
        )}
      >
        <p id={moodLeadId} className={cn("px-2 text-muted", compact ? "text-xs" : "text-sm")}>
          {MOOD_LEAD}
        </p>
        <SuggestionPills
          items={MOODS}
          onSelect={pickFrom(MOODS)}
          disabled={disabled}
          tone="quiet"
          size={size}
          labelledBy={moodLeadId}
          className="gap-0.5"
        />
      </div>
    </div>
  );
}
