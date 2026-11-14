import { ClipboardCheck, History, ShieldCheck, Sprout, type LucideIcon } from "lucide-react";
import { SuggestionPills } from "@/components/ui/suggestion-pills";
import { STARTER_PROMPTS, type StarterId } from "./chat-input-state";

type StarterPromptsProps = {
  onPick: (message: string) => void;
  disabled: boolean;
  /** The popup: a tidy stacked list of full width rows instead of centered pills. */
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
 * The ways to begin: four tasks. Each sends its words as the first message, through the same
 * checks as typed text. Feelings are typed, not picked.
 */
export function StarterPrompts({ onPick, disabled, compact = false }: StarterPromptsProps) {
  const pickStarter = (id: string) => {
    const message = STARTER_PROMPTS.find((entry) => entry.id === id)?.message;
    if (message) onPick(message);
  };
  if (!compact) {
    return (
      <SuggestionPills
        items={TASKS}
        onSelect={pickStarter}
        disabled={disabled}
        label="Ways to start"
        className="motion-safe:animate-rise motion-safe:[animation-delay:120ms]"
      />
    );
  }
  return (
    <ul aria-label="Ways to start" className="flex flex-col gap-2">
      {TASKS.map(({ id, label, icon: Icon }) => (
        <li key={id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => pickStarter(id)}
            className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-2 text-left text-[0.9375rem] font-medium text-ink transition-colors hover:bg-chip active:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon aria-hidden className="size-4 shrink-0 text-muted" />
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}
