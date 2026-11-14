import { describe, expect, it } from "vitest";
import { logGuideEvent } from "@/features/guide/events";
import { fakeSupabase, type Insert } from "./helpers/fake-db";

describe("logGuideEvent", () => {
  it("inserts user_id, kind and detail into guide_events", async () => {
    const log: Insert[] = [];
    const { client } = fakeSupabase({ label: "admin", log });
    await logGuideEvent(client, "u1", "crisis", { source: "input" });
    expect(log).toEqual([
      {
        client: "admin",
        table: "guide_events",
        row: { user_id: "u1", kind: "crisis", detail: { source: "input" } },
      },
    ]);
  });

  it("never throws, even when the client throws", async () => {
    const { client } = fakeSupabase({ label: "admin", log: [], throwOnTable: "guide_events" });
    await expect(logGuideEvent(client, "u1", "crisis", {})).resolves.toBeUndefined();
  });

  it("never throws when the insert reports an error", async () => {
    const { client } = fakeSupabase({ label: "admin", log: [], insertError: true });
    await expect(logGuideEvent(client, "u1", "output_blocked", {})).resolves.toBeUndefined();
  });
});
