import { describe, expect, it } from "vitest";
import { getConversationMessages, listConversations } from "@/features/guide/queries";
import { fakeSupabase } from "./helpers/fake-db";

const ID = "11111111-1111-4111-8111-111111111111";

describe("listConversations", () => {
  it("maps rows to id, title and updatedAt, reading only guide_conversations", async () => {
    const db = fakeSupabase({
      label: "db",
      log: [],
      conversations: [{ id: ID, title: "Find something", updated_at: "2026-11-14T10:00:00Z" }],
    });
    expect(await listConversations(db.client)).toEqual([
      { id: ID, title: "Find something", updatedAt: "2026-11-14T10:00:00Z" },
    ]);
    expect(db.tablesRead).toEqual(["guide_conversations"]);
  });

  it("returns an empty list when there are no chats", async () => {
    const db = fakeSupabase({ label: "db", log: [], conversations: [] });
    expect(await listConversations(db.client)).toEqual([]);
  });

  it("returns null on a read error or a throw, never the raw error", async () => {
    const failing = fakeSupabase({ label: "db", log: [], selectErrorOn: "guide_conversations" });
    expect(await listConversations(failing.client)).toBeNull();
    const throwing = fakeSupabase({ label: "db", log: [], throwOnTable: "guide_conversations" });
    expect(await listConversations(throwing.client)).toBeNull();
  });
});

describe("getConversationMessages", () => {
  const messages = [
    // The query asks for newest first; the function puts them back in reading order.
    { conversation_id: ID, role: "assistant", content: "Try this.", created_at: "t2" },
    { conversation_id: ID, role: "user", content: "Hi", created_at: "t1" },
    { conversation_id: ID, role: "system", content: "never shown", created_at: "t0" },
  ];

  it("returns the messages oldest first and drops unknown roles", async () => {
    const db = fakeSupabase({ label: "db", log: [], conversations: [{ id: ID }], messages });
    expect(await getConversationMessages(db.client, ID)).toEqual([
      { role: "user", content: "Hi", createdAt: "t1" },
      { role: "assistant", content: "Try this.", createdAt: "t2" },
    ]);
    expect(db.eqCalls).toContainEqual(["conversation_id", ID]);
  });

  it("returns null when the chat is not visible to the caller", async () => {
    const db = fakeSupabase({ label: "db", log: [], conversations: [], messages });
    expect(await getConversationMessages(db.client, ID)).toBeNull();
  });

  it("returns null when the messages cannot be read", async () => {
    const db = fakeSupabase({
      label: "db",
      log: [],
      conversations: [{ id: ID }],
      selectErrorOn: "guide_messages",
    });
    expect(await getConversationMessages(db.client, ID)).toBeNull();
  });
});
