import { ExternalLink } from "lucide-react";
import type { HydratedCard } from "../types";

type EvidenceCardData = Extract<HydratedCard, { kind: "evidence" }>;

function safeSourceUrl(url: string | null): string | null {
  return url !== null && url.startsWith("https://") ? url : null;
}

/** A source row from the app's own evidence table, with its limits stated. */
export function EvidenceCard({ card }: { card: EvidenceCardData }) {
  const href = safeSourceUrl(card.source_url);
  return (
    <article className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-4">
      <header className="flex flex-col gap-0.5">
        <h3 className="text-base font-bold">{card.source_name}</h3>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
          {card.year !== null ? <li>Year {card.year}</li> : null}
          {card.population ? <li>{card.population}</li> : null}
          <li>Strength: {card.strength}</li>
        </ul>
      </header>
      {card.caveat ? <p className="text-sm">{card.caveat}</p> : null}
      {card.verified ? null : (
        <p className="text-sm text-muted">Reported, not yet re-checked by our team.</p>
      )}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-action hover:underline md:min-h-0"
        >
          Source
          <ExternalLink aria-hidden className="size-4" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </article>
  );
}
