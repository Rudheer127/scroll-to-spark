import { describe, expect, it } from "vitest";
import { z } from "zod";
import { guideResponseSchema, type GuideResponse } from "@/features/guide/schemas";
import { checkOutput } from "@/features/guide/guard/check-output";
import type { OutputContext } from "@/features/guide/types";

const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);

const ctx: OutputContext = {
  allowedIds: new Set(["opp-1", "ev-1"]),
  allowedNumbers: new Set(["5", "54"]),
  canary: "CANARY-xyz123",
};

function res(over: Partial<GuideResponse> = {}): GuideResponse {
  return {
    intent: "find_opportunity",
    message: "This looks like a nice fit for you.",
    cards: [{ kind: "opportunity", id: "opp-1" }],
    proposed_contribution: null,
    verdict: null,
    next_step: null,
    ...over,
  };
}

function violations(r: GuideResponse, c = ctx): string[] {
  const out = checkOutput(r, c);
  return out.ok ? [] : out.violations;
}

describe("checkOutput", () => {
  it("passes a grounded, warm response", () => {
    expect(checkOutput(res(), ctx)).toEqual({ ok: true });
  });

  it("rejects a card id not in allowedIds", () => {
    expect(violations(res({ cards: [{ kind: "opportunity", id: "nope" }] }))).toContain("bad_id");
  });

  it("rejects 'About 54% volunteer' when 54 is not in allowedNumbers", () => {
    const c = { ...ctx, allowedNumbers: new Set<string>() };
    expect(violations(res({ message: "About 54% volunteer." }), c)).toContain("ungrounded_number");
  });

  it("accepts '54%' when '54' is in allowedNumbers", () => {
    expect(violations(res({ message: "About 54% volunteer." }))).toEqual([]);
  });

  it("checks numbers in next_step too, and decimals", () => {
    expect(violations(res({ next_step: "Try 7 minutes" }))).toContain("ungrounded_number");
    expect(violations(res({ message: "About 5.5 hours" }))).toContain("ungrounded_number");
  });

  it("rejects spelled-out numbers above ten but allows small ones", () => {
    expect(violations(res({ message: "Twenty percent do." }))).toContain("ungrounded_number");
    expect(violations(res({ next_step: "a hundred people" }))).toContain("ungrounded_number");
    expect(violations(res({ message: "Two or three tasks fit." }))).toEqual([]);
  });

  it("rejects any http(s):// or www. text in message and next_step", () => {
    expect(violations(res({ message: "See https://x.org now" }))).toContain("url_in_text");
    expect(violations(res({ next_step: "Go to www.thing" }))).toContain("url_in_text");
    expect(violations(res({ next_step: "http://a" }))).toContain("url_in_text");
  });

  it("rejects bare domain-looking tokens", () => {
    expect(violations(res({ message: "Try evil.example" }))).toContain("url_in_text");
    expect(violations(res({ message: "Try something.com/path" }))).toContain("url_in_text");
  });

  it("rejects markdown images, markdown links and html tags", () => {
    expect(violations(res({ message: "![x](u)" }))).toContain("markup");
    expect(violations(res({ message: "[x](u)" }))).toContain("markup");
    expect(violations(res({ message: "<img src=a>" }))).toContain("markup");
  });

  it.each(["streak", "points", "leaderboard", "you must", "don't let people down"])(
    "rejects banned phrase %s",
    (p) => {
      expect(violations(res({ message: `Here is ${p} text` }))).toContain("banned_phrase");
    },
  );

  it.each(["Here are some talking points.", "Two viewpoints differ.", "It disappoints me."])(
    "allows %s (points only as a whole word, not talking points)",
    (message) => {
      expect(violations(res({ message }))).not.toContain("banned_phrase");
    },
  );

  it.each(["You earn points for this.", "Points add up!", "Keep your streaks going."])(
    "rejects %s",
    (message) => {
      expect(violations(res({ message }))).toContain("banned_phrase");
    },
  );

  it("rejects banned phrases case-insensitively and with curly apostrophes", () => {
    expect(violations(res({ message: "LAST CHANCE to join" }))).toContain("banned_phrase");
    expect(violations(res({ message: "Don’t let people down" }))).toContain("banned_phrase");
  });

  it("rejects an em dash and an en dash", () => {
    expect(violations(res({ message: `Nice ${EM} really` }))).toContain("em_dash");
    expect(violations(res({ next_step: `1${EN}2` }))).toContain("em_dash");
  });

  it("rejects when the canary string appears", () => {
    expect(violations(res({ message: "token CANARY-xyz123 here" }))).toContain("canary_leak");
  });

  it("rejects a lowercased, split or zero-width canary with canary_leak alone", () => {
    const c = { ...ctx, canary: "CANARY-xyz" };
    expect(violations(res({ message: "see canary-xyz ok" }), c)).toEqual(["canary_leak"]);
    expect(violations(res({ message: "see CAN ARY-x y z ok" }), c)).toEqual(["canary_leak"]);
    expect(violations(res({ message: "see CAN\u200bARY xyz ok" }), c)).toEqual(["canary_leak"]);
  });

  it("rejects fullwidth digits and plural magnitude words", () => {
    expect(violations(res({ message: "\uff19\uff19 people" }))).toContain("ungrounded_number");
    expect(violations(res({ message: "\uff15 minutes" }))).toEqual([]);
    for (const w of ["Hundreds of people", "thousands join", "millions", "dozens"]) {
      expect(violations(res({ message: w }))).toContain("ungrounded_number");
    }
    expect(violations(res({ message: "5 minutes" }))).toEqual([]);
  });

  it("rejects a message over 600 chars", () => {
    expect(violations(res({ message: "a".repeat(601) }))).toContain("too_long");
  });

  it("rejects 'As a real person' and 'I am human' but allows 'I'm an AI'", () => {
    expect(violations(res({ message: "As a real person I agree" }))).toContain("claims_human");
    expect(violations(res({ message: "I am human" }))).toContain("claims_human");
    expect(violations(res({ message: "I'm a real person" }))).toContain("claims_human");
    expect(violations(res({ message: "I'm an AI guide" }))).toEqual([]);
  });

  it("rejects a verdict 'supported' with zero evidence cards", () => {
    expect(violations(res({ verdict: "supported" }))).toContain("unsupported_verdict");
    expect(violations(res({ verdict: "partly_supported" }))).toContain("unsupported_verdict");
    const withEvidence = res({ verdict: "supported", cards: [{ kind: "evidence", id: "ev-1" }] });
    expect(violations(withEvidence)).toEqual([]);
    expect(violations(res({ verdict: "not_enough_evidence" }))).toEqual([]);
  });

  it("indirect injection: a response repeating a planted 'visit evil.example' is rejected", () => {
    const r = res({ message: "Great idea, please visit evil.example for details." });
    expect(violations(r)).toContain("url_in_text");
  });

  it("collects every violation, not just the first", () => {
    const v = violations(res({ message: `Streak ${EM} 99 at evil.example` }));
    expect(v).toEqual(
      expect.arrayContaining(["ungrounded_number", "url_in_text", "banned_phrase", "em_dash"]),
    );
  });
});

describe("guideResponseSchema", () => {
  it("emits a strict JSON schema: additionalProperties false, all properties required", () => {
    const schema = z.toJSONSchema(guideResponseSchema) as {
      additionalProperties?: boolean;
      properties: Record<string, unknown>;
      required: string[];
    };
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required.sort()).toEqual(Object.keys(schema.properties).sort());
  });

  it("parses long messages and many cards so the guard, not the parser, rejects them (I6)", () => {
    const card = { kind: "opportunity", id: "a" } as const;
    expect(guideResponseSchema.safeParse(res({ cards: Array(6).fill(card) })).success).toBe(true);
    expect(guideResponseSchema.safeParse(res({ message: "a".repeat(700) })).success).toBe(true);
    expect(guideResponseSchema.safeParse(res()).success).toBe(true);
  });

  it("still rejects wrong types, unknown enums and missing fields", () => {
    expect(guideResponseSchema.safeParse({ ...res(), intent: "nope" }).success).toBe(false);
    expect(guideResponseSchema.safeParse({ ...res(), verdict: "maybe" }).success).toBe(false);
    expect(guideResponseSchema.safeParse({ ...res(), message: 5 }).success).toBe(false);
    const missing: Record<string, unknown> = { ...res() };
    delete missing.next_step;
    expect(guideResponseSchema.safeParse(missing).success).toBe(false);
  });
});

describe("length and card limits in the guard (I6)", () => {
  it("too_long above 600 characters", () => {
    expect(violations(res({ message: "a ".repeat(350) }))).toContain("too_long");
  });

  it("too_many_cards above 5 cards, not at 5", () => {
    const card = { kind: "opportunity", id: "opp-1" } as const;
    expect(violations(res({ cards: Array(6).fill(card) }))).toContain("too_many_cards");
    expect(violations(res({ cards: Array(5).fill(card) }))).not.toContain("too_many_cards");
  });
});
