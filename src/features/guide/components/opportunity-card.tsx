import { Clock, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { formatMinutes } from "@/lib/format-time";
import { EFFORT_LABELS, PLACE_LABELS } from "@/features/steps/constants";
import type { OpportunityRow } from "../types";

/** One real task from a partner group. The link goes to the existing step page for that task. */
export function OpportunityCard({ card }: { card: OpportunityRow }) {
  return (
    <article className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-4">
      <header className="flex flex-col gap-0.5">
        <h3 className="text-base font-bold">{card.title}</h3>
        <p className="text-sm text-muted">{card.org_name}</p>
      </header>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
        <li className="flex items-center gap-1.5">
          <Clock aria-hidden className="size-4" />
          {formatMinutes(card.minutes)}
        </li>
        <li className="flex items-center gap-1.5">
          <MapPin aria-hidden className="size-4" />
          {PLACE_LABELS[card.place]}
        </li>
        <li>{EFFORT_LABELS[card.effort].label}</li>
      </ul>
      <p className="text-sm text-muted">
        A real person from the group will reply within {card.reply_within_hours} hours.
      </p>
      <div>
        <ButtonLink href={`/steps/${card.id}`} variant="outline">
          See this step
        </ButtonLink>
      </div>
    </article>
  );
}
