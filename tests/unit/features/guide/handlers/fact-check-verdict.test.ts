import { describe, expect, it } from "vitest";
import { negatedAt } from "@/features/guide/guard/rules/negation";
import {
  affirmsOnlyWithSupport,
  echoOnly,
  mentionsCaveat,
  requiresVerdict,
} from "@/features/guide/handlers/fact-check-rules";
import { fixedResponse } from "@/features/guide/fixed-response";
import type { GuideResponse } from "@/features/guide/schemas";
import type { EvidenceRow } from "@/features/guide/types";
import { evidenceRow } from "../helpers/fake-db";

const res = (message: string, verdict: GuideResponse["verdict"]): GuideResponse => ({
  ...fixedResponse(message, "fact_check"),
  verdict,
});

describe("negatedAt (shared negator window)", () => {
  it("sees a negator within three words before the index, in the same sentence", () => {
    const t = "That is not accurate.";
    expect(negatedAt(t, t.indexOf("accurate"))).toBe(true);
    const u = "Not now. That is accurate.";
    expect(negatedAt(u, u.indexOf("accurate"))).toBe(false);
    const v = "It isn't correct";
    expect(negatedAt(v, v.indexOf("correct"))).toBe(true);
  });
});

describe("requiresVerdict (I4)", () => {
  it("rejects a fact_check answer with a null verdict", () => {
    expect(requiresVerdict(res("We have nothing on that.", null))).toBe("missing_verdict");
    expect(requiresVerdict(res("We have nothing on that.", "not_enough_evidence"))).toBeNull();
  });
});

describe("affirmsOnlyWithSupport (I4)", () => {
  it.each([
    "Yes, that is true.",
    "It's correct.",
    "That's right, people help.",
    "This is accurate.",
  ])("rejects %s without a supporting verdict", (message) => {
    expect(affirmsOnlyWithSupport(res(message, "unsupported"))).toBe("affirms_without_support");
    expect(affirmsOnlyWithSupport(res(message, "not_enough_evidence"))).toBe(
      "affirms_without_support",
    );
  });

  it("allows affirming words with supported or partly_supported", () => {
    expect(affirmsOnlyWithSupport(res("Yes, that is true.", "supported"))).toBeNull();
    expect(affirmsOnlyWithSupport(res("That's right, in part.", "partly_supported"))).toBeNull();
  });

  it("is negation aware", () => {
    expect(affirmsOnlyWithSupport(res("That is not accurate.", "unsupported"))).toBeNull();
    expect(affirmsOnlyWithSupport(res("It isn't correct.", "unsupported"))).toBeNull();
    expect(affirmsOnlyWithSupport(res("We cannot say that is true.", "unsupported"))).toBeNull();
  });
});

describe("mentionsCaveat uses whole words (minor f)", () => {
  const rows = [evidenceRow("e1", { caveat: "Survey from 24 states." })] as EvidenceRow[];
  const cited = (message: string): GuideResponse => ({
    ...res(message, "partly_supported"),
    cards: [{ kind: "evidence", id: "e1" }],
  });

  it("does not count 24 inside 2024 or states inside statesman", () => {
    const rule = mentionsCaveat(rows);
    expect(rule(cited("A 2024 survey, says a statesman."))).toBe("missing_caveat");
    expect(rule(cited("The survey covered 24 states only."))).toBeNull();
  });
});

describe("echoOnly AFFIRM is negation aware (minor f)", () => {
  const rule = echoOnly("Study shows 83% of Gen Z volunteer weekly", [
    evidenceRow("e1"),
  ] as EvidenceRow[]);

  it("passes an honest quoted denial", () => {
    expect(
      rule(res('You wrote "83% of Gen Z volunteer weekly", which is not true.', "unsupported")),
    ).toBeNull();
  });

  it("still rejects a quoted agreement", () => {
    expect(
      rule(res('You wrote "83% of Gen Z volunteer weekly", which is true.', "unsupported")),
    ).toBe("ungrounded_number");
  });
});
