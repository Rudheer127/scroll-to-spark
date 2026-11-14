import Link from "next/link";
import { cn } from "@/lib/cn";
import { EFFORTS, EFFORT_LABELS, type Effort } from "@/features/steps/constants";

/** Lets a person say how much they want to give. Pick a size again to go back to any size. */
export function EffortTabs({ current }: { current?: Effort }) {
  return (
    <nav aria-label="How much do you want to give?" className="flex flex-wrap gap-2">
      {EFFORTS.map((effort) => {
        const active = current === effort;
        return (
          <Link
            key={effort}
            href={active ? "/" : `/?effort=${effort}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-extrabold active:opacity-75 md:min-h-10",
              active ? "border-sun bg-sun" : "border-border bg-background hover:bg-chip",
            )}
          >
            {EFFORT_LABELS[effort].label}
          </Link>
        );
      })}
    </nav>
  );
}
