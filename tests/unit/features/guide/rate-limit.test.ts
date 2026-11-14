import { describe, expect, it } from "vitest";
import { RATE_PER_DAY, RATE_PER_MINUTE } from "@/features/guide/constants";
import { checkRateLimit } from "@/features/guide/rate-limit";
import { fakeSupabase, type Insert } from "./helpers/fake-db";

const check = (opts: { minuteCount?: number; dayCount?: number }) => {
  const log: Insert[] = [];
  const { client, tablesRead } = fakeSupabase({ label: "db", log, ...opts });
  return { result: checkRateLimit(client, "u1"), tablesRead };
};

describe("checkRateLimit", () => {
  it("uses the documented limits", () => {
    expect(RATE_PER_MINUTE).toBe(6);
    expect(RATE_PER_DAY).toBe(60);
  });

  it("allows a user under both limits and reads only guide_messages", async () => {
    const { result, tablesRead } = check({ minuteCount: 5, dayCount: 59 });
    expect(await result).toEqual({ allowed: true, retryAfterSec: 0 });
    expect(new Set(tablesRead)).toEqual(new Set(["guide_messages"]));
  });

  it("blocks at the per minute limit with a one minute retry", async () => {
    expect(await check({ minuteCount: 6, dayCount: 6 }).result).toEqual({
      allowed: false,
      retryAfterSec: 60,
    });
  });

  it("blocks at the daily limit with a longer retry", async () => {
    const res = await check({ minuteCount: 1, dayCount: 60 }).result;
    expect(res.allowed).toBe(false);
    expect(res.retryAfterSec).toBeGreaterThan(60);
  });

  it("throws on a database error so the pipeline can answer safely", async () => {
    const { client } = fakeSupabase({ label: "db", log: [], throwOnTable: "guide_messages" });
    await expect(checkRateLimit(client, "u1")).rejects.toThrow();
  });
});
