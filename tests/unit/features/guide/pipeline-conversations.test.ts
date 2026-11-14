import { describe, expect, it } from "vitest";
import { UNAVAILABLE_MESSAGE } from "@/features/guide/fallbacks";
import { guideReply, routerReply } from "./helpers/fake-llm";
import { setup } from "./helpers/setup";

const chat = () => ({
  router_output: [routerReply("chitchat")],
  guide_response: [guideReply({ intent: "chitchat", message: "Hello there." })],
});

const MINE = "11111111-1111-4111-8111-111111111111";
const THEIRS = "22222222-2222-4222-8222-222222222222";

describe("runGuideTurn: saved chats", () => {
  it("creates the chat through db before the user row and returns its id", async () => {
    const t = setup(chat());
    const res = await t.run("  Find   something small to do  ");
    const chatInsert = t.log.findIndex(
      (i) => i.table === "guide_conversations" && i.op === undefined,
    );
    const userRow = t.log.findIndex((i) => i.table === "guide_messages" && i.row.role === "user");
    expect(chatInsert).toBeGreaterThanOrEqual(0);
    expect(chatInsert).toBeLessThan(userRow);
    expect(t.log[chatInsert]).toMatchObject({
      client: "db",
      row: { user_id: "u1", title: "Find something small to do" },
    });
    expect(Object.keys(t.log[chatInsert].row).sort()).toEqual(["title", "user_id"]);
    expect(res.conversationId).toBe("new-id");
  });

  it("puts the chat id on the user row and on the assistant row, and bumps the chat", async () => {
    const t = setup(chat());
    await t.run("hello");
    const rows = t.log.filter((i) => i.table === "guide_messages");
    expect(rows.map((r) => [r.client, r.row.role, r.row.conversation_id])).toEqual([
      ["db", "user", "new-id"],
      ["admin", "assistant", "new-id"],
    ]);
    const bump = t.log.find((i) => i.table === "guide_conversations" && i.op === "update");
    expect(bump?.client).toBe("admin");
    expect(Object.keys(bump?.row ?? {})).toEqual(["updated_at"]);
  });

  it("continues a chat that is the caller's, without creating a new one", async () => {
    const t = setup(chat(), { conversations: [{ id: MINE, user_id: "u1" }] });
    const res = await t.run("hello again", MINE);
    expect(res.conversationId).toBe(MINE);
    const created = t.log.filter((i) => i.table === "guide_conversations" && i.op === undefined);
    expect(created).toHaveLength(0);
    expect(t.db.eqCalls).toContainEqual(["id", MINE]);
    expect(t.db.eqCalls).toContainEqual(["user_id", "u1"]);
  });

  it("silently starts a new chat for an unknown or someone else's id", async () => {
    const t = setup(chat(), { conversations: [{ id: THEIRS, user_id: "someone-else" }] });
    const res = await t.run("hello", THEIRS);
    expect(res.conversationId).toBe("new-id");
    const rows = t.log.filter((i) => i.table === "guide_messages");
    expect(rows.every((r) => r.row.conversation_id === "new-id")).toBe(true);
  });

  it("fails closed with no model call when the chat cannot be created", async () => {
    const t = setup(chat(), { failInsertOn: "guide_conversations" });
    const res = await t.run("hello");
    expect(res.response.message).toBe(UNAVAILABLE_MESSAGE);
    expect(res.conversationId).toBeUndefined();
    expect(t.llm.calls).toHaveLength(0);
    expect(t.log.filter((i) => i.table === "guide_messages")).toHaveLength(0);
    expect(JSON.stringify(t.log.filter((i) => i.table === "guide_events"))).toContain(
      "conversation_insert",
    );
  });

  it("creates nothing for a crisis, an empty or a rate limited turn", async () => {
    for (const [message, opts] of [
      ["I want to die", {}],
      ["   ", {}],
      ["hello", { dayCount: 999 }],
    ] as const) {
      const t = setup(chat(), opts);
      const res = await t.run(message);
      expect(res.conversationId).toBeUndefined();
      expect(t.log.filter((i) => i.table === "guide_conversations")).toHaveLength(0);
    }
  });

  it("titles the chat from the first message, with no extra model call", async () => {
    const t = setup(chat());
    await t.run("hello");
    const title = t.log.find((i) => i.table === "guide_conversations")?.row.title;
    expect(title).toBe("hello");
    expect(t.llm.calls).toHaveLength(2);
  });
});
