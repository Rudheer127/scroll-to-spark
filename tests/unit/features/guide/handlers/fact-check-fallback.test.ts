import { describe, expect, it } from "vitest";
import { checkOutput } from "@/features/guide/guard/check-output";
import { evidenceOnFileResponse } from "@/features/guide/handlers/fact-check";
import { evidenceRow } from "../helpers/fake-db";
import { guideReply, routerReply } from "../helpers/fake-llm";
import { setup } from "../helpers/setup";
import type { EvidenceRow } from "@/features/guide/types";

const row = evidenceRow("e1", { caveat: "All Americans, not 18 to 24. Link needs a re-check." });
const ASK = "Is it true that 54% of Americans helped their neighbors in 2023?";

describe("evidenceOnFileResponse", () => {
  it("matching figure: partly_supported, card, unverified note and caveat, passes the guard", () => {
    const res = evidenceOnFileResponse([row as unknown as EvidenceRow], ASK);
    expect(res.verdict).toBe("partly_supported");
    expect(res.cards).toEqual([{ kind: "evidence", id: "e1" }]);
    expect(res.message).toMatch(/not yet re-checked/i);
    expect(res.message).toMatch(/not 18 to 24/i);
    expect(res.message).not.toMatch(/verified by|\bis true\b|\byes\b/i);
  });

  it("a figure the row does not carry never gets support", () => {
    const res = evidenceOnFileResponse(
      [row as unknown as EvidenceRow],
      "Is it true that 83% volunteer weekly?",
    );
    expect(res.verdict).toBe("not_enough_evidence");
    expect(res.message).not.toMatch(/83/);
  });
});

describe("fact check when the model misbehaves", () => {
  it("a blocked first answer and a failed repair still end in the evidence-on-file answer", async () => {
    const t = setup(
      {
        router_output: [routerReply("fact_check")],
        guide_response: [
          guideReply({
            intent: "fact_check",
            verdict: "supported",
            cards: [{ kind: "evidence", id: "e1" }],
            message: "About 54% of Americans helped neighbors in 2023, per the Census.",
          }),
        ],
      },
      { evidence: [row] },
    );
    const res = await t.run(ASK);
    expect(res.response.message).toMatch(/Closest thing on file/);
    expect(res.response.verdict).toBe("partly_supported");
    expect(res.cards).toHaveLength(1);
  });
});

void checkOutput;
