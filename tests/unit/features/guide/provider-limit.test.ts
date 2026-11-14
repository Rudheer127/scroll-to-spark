import { describe, expect, it } from "vitest";
import { RATE_LIMIT_MESSAGE, UNAVAILABLE_MESSAGE } from "@/features/guide/fallbacks";
import { runGuideTurn } from "@/features/guide/pipeline";
import { fail, routerReply } from "./helpers/fake-llm";
import { setup } from "./helpers/setup";
import { jpegUrl } from "./vision/images";

const failures = (t: ReturnType<typeof setup>) =>
  t.log
    .filter((i) => i.table === "guide_events" && i.row.kind === "provider_failure")
    .map((i) => i.row.detail);

describe("provider rate limits (free tier caps)", () => {
  it("shows the friendly breather copy and logs daily_or_minute_limit", async () => {
    const t = setup({
      router_output: [routerReply("chitchat")],
      guide_response: [fail("rate_limited")],
    });
    const res = await t.run("hello there");
    expect(res.response.message).toBe(RATE_LIMIT_MESSAGE);
    expect(res.outcome).toBe("rate_limited");
    expect(failures(t)).toContainEqual({ reason: "daily_or_minute_limit" });
  });

  it("keeps the unavailable copy for other failures, and records payment_required as is", async () => {
    const t = setup({
      router_output: [routerReply("chitchat")],
      guide_response: [fail("payment_required")],
    });
    const res = await t.run("hello there");
    expect(res.response.message).toBe(UNAVAILABLE_MESSAGE);
    expect(res.outcome).toBe("unavailable");
    expect(failures(t)).toContainEqual({ reason: "payment_required" });
  });

  it("a rate limited vision call gets the breather copy too", async () => {
    const t = setup({ image_description: [fail("rate_limited")] });
    const res = await runGuideTurn({
      userId: "u1",
      message: "read this",
      db: t.db.client,
      admin: t.admin.client,
      llm: t.llm,
      today: "2026-11-14",
      imageDataUrl: jpegUrl,
    });
    expect(res.outcome).toBe("rate_limited");
    expect(failures(t)).toContainEqual({ stage: "vision", reason: "daily_or_minute_limit" });
  });
});
