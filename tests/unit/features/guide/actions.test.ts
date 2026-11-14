import { beforeEach, describe, expect, it, vi } from "vitest";
import { guideReply, routerReply } from "./helpers/fake-llm";
import { arrange, mocks } from "./helpers/route-setup";

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mocks.db }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    mocks.serviceCreated += 1;
    return mocks.admin;
  },
}));
vi.mock("@/features/guide/llm/from-env", () => ({ createGuideLlm: () => mocks.llm }));

import { confirmContribution, sendGuideMessage } from "@/features/guide/actions";

const form = (message: string) => {
  const f = new FormData();
  f.set("message", message);
  return f;
};

const valid = { title: "Sorted cans", description: "", minutes: 60, occurred_on: "2026-01-02" };

beforeEach(() => vi.useRealTimers());

describe("sendGuideMessage", () => {
  it("signed out: fails with a sign-in message and makes no llm call", async () => {
    const t = arrange({ user: null });
    const res = await sendGuideMessage(form("hi"));
    expect(res).toMatchObject({ ok: false, error: "Please sign in to use the guide." });
    expect(t.llm.calls).toHaveLength(0);
  });

  it("signed in: returns the turn result", async () => {
    arrange({
      user: { id: "u1" },
      script: { router_output: [routerReply("chitchat")], guide_response: [guideReply()] },
    });
    const res = await sendGuideMessage(form("hello"));
    expect(res.ok && res.data.source).toBe("ai");
  });

  it("rejects a missing or oversized message", async () => {
    arrange({ user: { id: "u1" } });
    expect((await sendGuideMessage(new FormData())).ok).toBe(false);
    expect((await sendGuideMessage(form("a".repeat(4001)))).ok).toBe(false);
  });
});

describe("confirmContribution", () => {
  it("takes the user id only from the session, ignoring a client-sent user_id", async () => {
    const t = arrange({ user: { id: "session-user" } });
    const res = await confirmContribution({ ...valid, user_id: "someone-else" });
    expect(res).toEqual({ ok: true, data: { id: "new-id" } });
    const row = t.log.find((i) => i.table === "contributions")?.row;
    expect(row?.user_id).toBe("session-user");
  });

  it("inserts only the allowed columns, never verification, even if the client sends partner_confirmed", async () => {
    const t = arrange({ user: { id: "u1" } });
    await confirmContribution({ ...valid, verification: "partner_confirmed" });
    const inserts = t.log.filter((i) => i.table === "contributions");
    expect(inserts).toHaveLength(1);
    expect(Object.keys(inserts[0]?.row ?? {}).sort()).toEqual(
      ["description", "minutes", "occurred_on", "title", "user_id"].sort(),
    );
    expect(inserts[0]?.client).toBe("db");
  });

  it("signed out fails and inserts nothing", async () => {
    const t = arrange({ user: null });
    const res = await confirmContribution(valid);
    expect(res.ok).toBe(false);
    expect(t.log).toHaveLength(0);
  });

  it("rejects a future date and 2000 minutes", async () => {
    const t = arrange({ user: { id: "u1" } });
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    expect((await confirmContribution({ ...valid, occurred_on: future })).ok).toBe(false);
    expect((await confirmContribution({ ...valid, minutes: 2000 })).ok).toBe(false);
    expect(t.log).toHaveLength(0);
  });

  it("maps a database error to a plain message without the raw error", async () => {
    arrange({ user: { id: "u1" }, db: { insertError: true } });
    const res = await confirmContribution(valid);
    expect(res).toMatchObject({ ok: false, error: "We could not save that. Try again." });
    expect(JSON.stringify(res)).not.toContain("denied");
  });
});
