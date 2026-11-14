import { MOODS } from "../moods";
import { STARTER_PROMPTS } from "./chat-input-state";

type StarterPromptsProps = { onPick: (message: string) => void; disabled: boolean };

const CHIP_CLASS =
  "min-h-11 rounded-full border border-control bg-surface px-4 text-sm font-semibold text-ink hover:bg-chip active:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10";

/** The empty state: what the guide is, how you feel, and real ways to begin. */
export function StarterPrompts({ onPick, disabled }: StarterPromptsProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-[70ch] flex-col gap-1">
        <h2 className="text-xl font-bold">Hi, I am the Spark Guide, an AI.</h2>
        <p className="text-muted">
          I can find one small thing for you to do, help you log something you already did and thank
          you for it, or check a civic claim.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-muted">How are you feeling?</h3>
        <ul className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <li key={mood.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(mood.message)}
                className={CHIP_CLASS}
              >
                {mood.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-muted">Or start with</h3>
        <ul className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((starter) => (
            <li key={starter.label}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(starter.message)}
                className={CHIP_CLASS}
              >
                {starter.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
