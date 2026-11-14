import { describe, expect, it } from "vitest";
import {
  activeChatKey,
  decideStorageSync,
  lastTurnKey,
  markTurnFinished,
  readActiveChat,
  writeActiveChat,
  type ChatStorage,
} from "@/features/guide/components/chat-sync-state";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

function memoryStorage(): ChatStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const blocked: ChatStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("active chat storage", () => {
  it("keeps one id per signed-in person", () => {
    const storage = memoryStorage();
    writeActiveChat(storage, "u1", A);
    writeActiveChat(storage, "u2", B);
    expect(readActiveChat(storage, "u1")).toBe(A);
    expect(readActiveChat(storage, "u2")).toBe(B);
    expect(readActiveChat(storage, "u3")).toBeNull();
  });

  it("forgets the id on null and ignores anything that is not a chat id", () => {
    const storage = memoryStorage();
    writeActiveChat(storage, "u1", A);
    writeActiveChat(storage, "u1", null);
    expect(readActiveChat(storage, "u1")).toBeNull();
    storage.setItem(activeChatKey("u1"), "<script>");
    expect(readActiveChat(storage, "u1")).toBeNull();
  });

  it("never throws when storage is blocked", () => {
    expect(readActiveChat(blocked, "u1")).toBeNull();
    expect(() => writeActiveChat(blocked, "u1", A)).not.toThrow();
    expect(() => markTurnFinished(blocked, "u1", 1)).not.toThrow();
  });

  it("stores only a timestamp for a finished turn", () => {
    const storage = memoryStorage();
    markTurnFinished(storage, "u1", 1234);
    expect(storage.data.get(lastTurnKey("u1"))).toBe("1234");
  });
});

describe("decideStorageSync", () => {
  const ctx = { userId: "u1", sending: false, currentId: A, storedActiveId: A };

  it("follows another tab that opened a different chat", () => {
    expect(decideStorageSync({ key: activeChatKey("u1"), newValue: B }, ctx)).toEqual({
      kind: "load",
      id: B,
    });
  });

  it("does nothing when the chat is already the one on screen", () => {
    expect(decideStorageSync({ key: activeChatKey("u1"), newValue: A }, ctx)).toEqual({
      kind: "none",
    });
  });

  it("clears when another tab started a new chat, unless already clear", () => {
    const change = { key: activeChatKey("u1"), newValue: null };
    expect(decideStorageSync(change, ctx)).toEqual({ kind: "clear" });
    expect(decideStorageSync(change, { ...ctx, currentId: null })).toEqual({ kind: "none" });
  });

  it("reloads the open chat after another tab finished a turn in it", () => {
    const change = { key: lastTurnKey("u1"), newValue: "99" };
    expect(decideStorageSync(change, ctx)).toEqual({ kind: "load", id: A });
    expect(decideStorageSync(change, { ...ctx, currentId: null })).toEqual({ kind: "load", id: A });
    expect(decideStorageSync(change, { ...ctx, currentId: B })).toEqual({ kind: "none" });
    expect(decideStorageSync(change, { ...ctx, storedActiveId: null })).toEqual({ kind: "none" });
  });

  it("never interrupts a tab that is waiting for an answer", () => {
    const sending = { ...ctx, sending: true };
    expect(decideStorageSync({ key: activeChatKey("u1"), newValue: B }, sending).kind).toBe("none");
    expect(decideStorageSync({ key: lastTurnKey("u1"), newValue: "1" }, sending).kind).toBe("none");
  });

  it("ignores other people's keys, unrelated keys and storage clears", () => {
    expect(decideStorageSync({ key: activeChatKey("u2"), newValue: B }, ctx).kind).toBe("none");
    expect(decideStorageSync({ key: "theme", newValue: "dark" }, ctx).kind).toBe("none");
    expect(decideStorageSync({ key: null, newValue: null }, ctx).kind).toBe("none");
  });
});
