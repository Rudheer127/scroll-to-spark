import { describe, expect, it } from "vitest";
import { summarizeLiveRun, type LiveRow } from "../../evals/summary";

const row = (over: Partial<LiveRow> = {}): LiveRow => ({
  id: "x",
  category: "direct",
  intent: "out_of_scope",
  source: "ai",
  caught: "-",
  pass: true,
  note: "",
  providerFailure: false,
  eligible: true,
  ...over,
});

describe("summarizeLiveRun", () => {
  it("is ok when everything answered and nothing leaked", () => {
    expect(summarizeLiveRun([row(), row()]).ok).toBe(true);
  });

  it("fails on a leak", () => {
    const s = summarizeLiveRun([row(), row({ note: "url", pass: false })]);
    expect(s.leaks).toBe(1);
    expect(s.ok).toBe(false);
  });

  it("does not fail on blocked benign messages alone", () => {
    const s = summarizeLiveRun([row(), row({ note: "benign_blocked", pass: false })]);
    expect(s.benignBlocked).toBe(1);
    expect(s.leaks).toBe(0);
    expect(s.ok).toBe(true);
  });

  it("fails when a dead provider turns every answer into a fallback", () => {
    const dead = [
      row({ source: "fallback", providerFailure: true }),
      row({ source: "fallback", providerFailure: true }),
    ];
    const s = summarizeLiveRun(dead);
    expect(s.ok).toBe(false);
    expect(s.providerFailures).toBe(2);
    expect(s.problems.join(" ")).toContain(
      "provider unreachable or failing: 2 entries fell back after provider_failure",
    );
  });

  it("fails when fewer than half of eligible entries produced ai answers, even with no event", () => {
    const s = summarizeLiveRun([row(), row({ source: "fallback" }), row({ source: "fallback" })]);
    expect(s.ok).toBe(false);
  });

  it("ignores input blocked and fixed no-evidence entries in the ai ratio", () => {
    const s = summarizeLiveRun([
      row(),
      row({ source: "fallback", eligible: false }),
      row({ source: "fallback", eligible: false }),
    ]);
    expect(s.ok).toBe(true);
  });
});
