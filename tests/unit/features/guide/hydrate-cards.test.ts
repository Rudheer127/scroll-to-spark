import { describe, expect, it } from "vitest";
import { hydrateCards } from "@/features/guide/hydrate-cards";
import { fixedResponse } from "@/features/guide/fixed-response";
import type { OpportunityRow } from "@/features/guide/types";

const row = (id: string): OpportunityRow => ({
  id,
  title: `T${id}`,
  description: null,
  org_name: "Org",
  effort: "tiny",
  minutes: 10,
  place: "home",
  reply_within_hours: 48,
  is_demo: false,
});

const withCards = (cards: { kind: "opportunity" | "evidence"; id: string }[]) => ({
  ...fixedResponse("x"),
  cards,
});

describe("hydrateCards", () => {
  it("builds cards from fetched rows, in model order", () => {
    const out = hydrateCards(
      withCards([
        { kind: "opportunity", id: "b" },
        { kind: "opportunity", id: "a" },
      ]),
      [row("a"), row("b")],
    );
    expect(out.map((c) => c.id)).toEqual(["b", "a"]);
    expect(out[0]).toEqual({ kind: "opportunity", ...row("b") });
  });

  it("carries is_demo from the row onto the card (I3)", () => {
    const out = hydrateCards(withCards([{ kind: "opportunity", id: "a" }]), [
      { ...row("a"), is_demo: true },
    ]);
    expect(out[0]).toMatchObject({ kind: "opportunity", id: "a", is_demo: true });
  });

  it("drops unknown ids, duplicates and non opportunity kinds", () => {
    const out = hydrateCards(
      withCards([
        { kind: "opportunity", id: "zzz" },
        { kind: "opportunity", id: "a" },
        { kind: "opportunity", id: "a" },
        { kind: "evidence", id: "a" },
      ]),
      [row("a")],
    );
    expect(out).toHaveLength(1);
  });
});

describe("hydrateCards: contributions", () => {
  const mine = {
    id: "c1",
    user_id: "u1",
    title: "Food drive",
    description: "secret text",
    minutes: 180,
    occurred_on: "2026-11-08",
    verification: "self_reported",
    created_at: "2026-11-08T00:00:00Z",
  };

  it("builds a contribution card from fetched rows with only display fields", () => {
    const response = {
      ...fixedResponse("x"),
      cards: [{ kind: "contribution" as const, id: "c1" }],
    };
    expect(hydrateCards(response, [], [mine])).toEqual([
      {
        kind: "contribution",
        id: "c1",
        title: "Food drive",
        minutes: 180,
        occurred_on: "2026-11-08",
        verification: "self_reported",
      },
    ]);
  });

  it("drops contribution ids with no fetched row", () => {
    const response = {
      ...fixedResponse("x"),
      cards: [{ kind: "contribution" as const, id: "zz" }],
    };
    expect(hydrateCards(response, [], [mine])).toEqual([]);
  });
});

describe("hydrateCards: evidence", () => {
  const ev = {
    id: "e1",
    claim: "secret claim text",
    source_name: "Census",
    source_url: null,
    year: 2023,
    population: "All Americans",
    strength: "weak",
    verified_at: "2026-10-01T00:00:00Z",
    caveat: "Limits.",
  };
  const res = { ...fixedResponse("x"), cards: [{ kind: "evidence" as const, id: "e1" }] };

  it("builds an evidence card from fetched rows only, with verified as a boolean", () => {
    expect(hydrateCards(res, [], [], [ev])).toEqual([
      {
        kind: "evidence",
        id: "e1",
        source_name: "Census",
        source_url: null,
        year: 2023,
        population: "All Americans",
        strength: "weak",
        caveat: "Limits.",
        verified: true,
      },
    ]);
    expect(hydrateCards(res, [], [], [])).toEqual([]);
  });
});
