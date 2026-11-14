import { formatMinutes } from "@/lib/format-time";
import type { HydratedCard } from "../types";

type LoggedCardData = Extract<HydratedCard, { kind: "contribution" }>;

/** Something the person already logged, read from their own rows. */
export function LoggedCard({ card }: { card: LoggedCardData }) {
  return (
    <article className="flex flex-col gap-1 rounded-(--radius-card) border border-border bg-surface p-4">
      <h3 className="text-base font-bold">{card.title}</h3>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
        <li>{formatMinutes(card.minutes)}</li>
        <li>{card.occurred_on}</li>
        <li>Self reported</li>
      </ul>
    </article>
  );
}
