import { Sparkles } from "lucide-react";
import { HERO_EXAMPLES } from "../content";

const SPARKS = [
  { left: "38%", size: "size-2", color: "bg-sun", d: "0s", t: "5s" },
  { left: "46%", size: "size-1.5", color: "bg-coral", d: "1.2s", t: "6s" },
  { left: "54%", size: "size-2.5", color: "bg-teal", d: "2.1s", t: "5.5s" },
  { left: "62%", size: "size-1.5", color: "bg-lavender", d: "0.6s", t: "6.5s" },
  { left: "42%", size: "size-1.5", color: "bg-lavender", d: "3s", t: "5s" },
  { left: "58%", size: "size-2", color: "bg-sun", d: "3.8s", t: "6s" },
  { left: "50%", size: "size-1", color: "bg-ink", d: "1.8s", t: "7s" },
  { left: "66%", size: "size-2", color: "bg-coral", d: "4.4s", t: "5.5s" },
] as const;

const FEED_CARDS = [
  { className: "left-[2%] top-[4%] w-[46%]", r: "-4deg", d: "0s" },
  { className: "right-[0%] top-[14%] w-[44%]", r: "3deg", d: "1.4s" },
  { className: "left-[10%] top-[34%] w-[40%]", r: "2deg", d: "2.6s" },
] as const;

/**
 * Decorative hero animation: a heavy feed drifts above, and a spark rises and turns into one small step.
 * Pure CSS motion. It carries no information that the page text does not already say.
 */
export function HeroScene() {
  return (
    <div aria-hidden className="relative h-[23.75rem] w-full sm:h-[28.75rem] lg:h-[35rem]">
      {FEED_CARDS.map((card) => (
        <div
          key={card.className}
          style={{ "--r": card.r, "--d": card.d } as React.CSSProperties}
          className={`landing-float absolute rounded-(--radius-input) border border-ink/15 bg-ink/10 p-4 ${card.className}`}
        >
          <div className="mb-3 h-2.5 w-3/4 rounded-full bg-ink/25" />
          <div className="mb-2 h-2 w-full rounded-full bg-ink/15" />
          <div className="h-2 w-2/3 rounded-full bg-ink/15" />
        </div>
      ))}

      {SPARKS.map((spark) => (
        <span
          key={spark.left + spark.d}
          style={{ left: spark.left, "--d": spark.d, "--t": spark.t } as React.CSSProperties}
          className={`landing-spark-up absolute bottom-[44%] rounded-full ${spark.size} ${spark.color}`}
        />
      ))}

      <div className="absolute bottom-[34%] left-[44%] flex size-16 items-center justify-center rounded-full bg-sun text-on-sun landing-pulse">
        <Sparkles className="size-7" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[30%] sm:h-[26%]">
        {HERO_EXAMPLES.map((example, index) => (
          <div
            key={example.text}
            style={{ "--d": `${index * 3}s` } as React.CSSProperties}
            className="landing-cycle absolute inset-0 flex flex-col justify-center gap-1 rounded-(--radius-card) bg-surface px-5 py-3 text-ink shadow-(--shadow-pop)"
          >
            <span className="text-xs font-bold text-muted">Example step, {example.minutes}</span>
            <span className="font-display text-base font-semibold sm:text-lg">{example.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
