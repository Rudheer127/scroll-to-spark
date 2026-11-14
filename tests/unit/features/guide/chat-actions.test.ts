import { describe, expect, it, vi } from "vitest";
import { guideReply, routerReply } from "./helpers/fake-llm";
import { arrange, mocks } from "./helpers/route-setup";

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mocks.db }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => mocks.admin }));
vi.mock("@/features/guide/llm/from-env", () => ({ createGuideLlm: () => mocks.llm }));

import { deleteConversation, loadGuideChat, sendGuideMessage } from "@/features/guide/actions";

const ID = "11111111-1111-4111-8111-111111111111";

describe("deleteConversation", () => {
  it("deletes the chat through the user session and reports success", async () => {
    const t = arrange({ user: { id: "u1" }, db: { conversations: [{ id: ID, user_id: "u1" }] } });
    expect(await deleteConversation(ID)).toEqual({ ok: true, data: undefined });
    const del = t.log.find((i) => i.op === "delete");
    expect(del).toMatchObject({ client: "db", table: "guide_conversations" });
  });

  it("rejects a malformed id without touching the database", async () => {
    const t = arrange({ user: { id: "u1" } });
    const res = await deleteConversation("not-a-uuid");
    expect(res).toMatchObject({ ok: false, error: "That chat could not be found." });
    expect(t.log).toHaveLength(0);
    expect(t.getUser).not.toHaveBeenCalled();
  });

  it("says not found when RLS hides the chat (someone else's)", async () => {
    arrange({ user: { id: "u1" }, db: { conversations: [] } });
    expect(await deleteConversation(ID)).toMatchObject({ ok: false });
  });

  it("signed out fails with the sign-in message and deletes nothing", async () => {
    const t = arrange({ user: null });
    expect(await deleteConversation(ID)).toMatchObject({
      ok: false,
      error: "Please sign in to use the guide.",
    });
    expect(t.log).toHaveLength(0);
  });

  it("maps a database error to plain words", async () => {
    arrange({ user: { id: "u1" }, db: { selectErrorOn: "guide_conversations" } });
    const res = await deleteConversation(ID);
    expect(res).toMatchObject({ ok: false, error: "The chat could not be deleted. Try again." });
  });
});

describe("loadGuideChat", () => {
  it("returns the messages of the caller's chat", async () => {
    arrange({
      user: { id: "u1" },
      db: {
        conversations: [{ id: ID }],
        messages: [{ conversation_id: ID, role: "user", content: "hi", created_at: "t1" }],
      },
    });
    const res = await loadGuideChat(ID);
    expect(res).toEqual({
      ok: true,
      data: { id: ID, messages: [{ role: "user", content: "hi", createdAt: "t1" }] },
    });
  });

  it("returns a plain not found for a missing, foreign or malformed id", async () => {
    arrange({ user: { id: "u1" }, db: { conversations: [] } });
    expect(await loadGuideChat(ID)).toMatchObject({ ok: false });
    expect(await loadGuideChat("../etc")).toMatchObject({ ok: false });
    expect(await loadGuideChat(42)).toMatchObject({ ok: false });
  });
});

describe("sendGuideMessage with a chat id", () => {
  it("passes a valid chat id through and returns the chat id", async () => {
    const t = arrange({
      user: { id: "u1" },
      db: { conversations: [{ id: ID, user_id: "u1" }] },
      script: { router_output: [routerReply("chitchat")], guide_response: [guideReply()] },
    });
    const form = new FormData();
    form.set("message", "hello");
    form.set("conversationId", ID);
    const res = await sendGuideMessage(form);
    expect(res.ok && res.data.conversationId).toBe(ID);
    expect(t.log.filter((i) => i.table === "guide_conversations" && !i.op)).toHaveLength(0);
  });

  it("ignores a malformed chat id and starts a new chat", async () => {
    arrange({
      user: { id: "u1" },
      script: { router_output: [routerReply("chitchat")], guide_response: [guideReply()] },
    });
    const form = new FormData();
    form.set("message", "hello");
    form.set("conversationId", "'; drop table x; --");
    const res = await sendGuideMessage(form);
    expect(res.ok && res.data.conversationId).toBe("new-id");
  });
});
