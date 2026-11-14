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
