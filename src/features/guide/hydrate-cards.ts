import type { GuideResponse } from "./schemas";
import type { HydratedCard, OpportunityRow } from "./types";

/**
 * Turns validated card ids into display cards using rows fetched this turn.
 * Nothing here reads model text, and an id with no matching row is dropped.
 */
export function hydrateCards(response: GuideResponse, rows: OpportunityRow[]): HydratedCard[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const seen = new Set<string>();
  const cards: HydratedCard[] = [];
  for (const card of response.cards) {
    const row = byId.get(card.id);
    if (card.kind !== "opportunity" || !row || seen.has(card.id)) continue;
    seen.add(card.id);
    cards.push({ kind: "opportunity", ...row });
  }
  return cards;
}
