import type { GuideResponse } from "./schemas";
import type { ContributionRow, EvidenceRow, HydratedCard, OpportunityRow } from "./types";

/**
 * Turns validated card ids into display cards using rows fetched this turn.
 * Nothing here reads model text, and an id with no matching row is dropped.
 */
export function hydrateCards(
  response: GuideResponse,
  rows: OpportunityRow[],
  contributions: ContributionRow[] = [],
  evidence: EvidenceRow[] = [],
): HydratedCard[] {
  const opportunities = new Map(rows.map((row) => [row.id, row]));
  const mine = new Map(contributions.map((row) => [row.id, row]));
  const proof = new Map(evidence.map((row) => [row.id, row]));
  const seen = new Set<string>();
  const cards: HydratedCard[] = [];
  for (const { kind, id } of response.cards) {
    const key = `${kind}:${id}`;
    if (seen.has(key)) continue;
    const opportunity = opportunities.get(id);
    const own = mine.get(id);
    if (kind === "opportunity" && opportunity) {
      cards.push({ kind, ...opportunity });
    } else if (kind === "contribution" && own) {
      const { title, minutes, occurred_on, verification } = own;
      cards.push({ kind, id, title, minutes, occurred_on, verification });
    } else if (kind === "evidence" && proof.has(id)) {
      const { source_name, source_url, year, population, strength, caveat, verified_at } =
        proof.get(id) as EvidenceRow;
      const verified = verified_at !== null;
      cards.push({
        kind,
        id,
        source_name,
        source_url,
        year,
        population,
        strength,
        caveat,
        verified,
      });
    } else continue;
    seen.add(key);
  }
  return cards;
}
