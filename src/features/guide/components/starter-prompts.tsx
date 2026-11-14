import { Button } from "@/components/ui/button";
import { STARTER_PROMPTS } from "./chat-input-state";

type StarterPromptsProps = { onPick: (message: string) => void; disabled: boolean };

/** The empty state: what the guide is, what it can do, and three real ways to begin. */
export function StarterPrompts({ onPick, disabled }: StarterPromptsProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex max-w-[70ch] flex-col gap-1">
        <h2 className="text-xl font-bold">Hi, I am the Spark Guide, an AI.</h2>
        <p className="text-muted">
          I can find one small thing for you to do, help you log something you already did and thank
          you for it, or check a civic claim.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((starter) => (
          <li key={starter.label}>
            <Button variant="outline" disabled={disabled} onClick={() => onPick(starter.message)}>
              {starter.label}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
