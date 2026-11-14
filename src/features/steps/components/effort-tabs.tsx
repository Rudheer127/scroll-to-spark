import Link from "next/link";
import { cn } from "@/lib/cn";
import { EFFORTS, EFFORT_LABELS, type Effort } from "@/features/steps/constants";

/** Lets a person say how much they want to give. It reloads the page with ?effort= in the address. */
export function EffortTabs({ current }: { current?: Effort }) {
  const options: { href: string; label: string; active: boolean }[] = [
    { href: "/", label: "Any size", active: !current },
    ...EFFORTS.map((effort) => ({
      href: `/?effort=${effort}`,
      label: EFFORT_LABELS[effort].label,
      active: current === effort,
    })),
  ];

  return (
    <nav aria-label="How much do you want to give?" className="flex flex-wrap gap-2">
      {options.map(({ href, label, active }) => (
        <Link
          key={label}
          href={href}
          aria-current={active ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold active:opacity-75 md:min-h-10",
            active
              ? "border-ink bg-ink text-white"
              : "border-control bg-surface hover:bg-background",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
