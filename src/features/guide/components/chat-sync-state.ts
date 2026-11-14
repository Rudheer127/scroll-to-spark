/**
 * Pure helpers that keep the open guide chat in step across reloads and tabs. The browser keeps
 * only ids and a timestamp, never message text, and every key carries the signed-in user id so
 * another account on the same browser never picks up someone else's chat.
 */

const ACTIVE_PREFIX = "guide:active-chat:";
const LAST_TURN_PREFIX = "guide:last-turn:";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ChatStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** The browser's localStorage, or null where touching it throws (some private modes). */
export function browserStorage(): ChatStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const activeChatKey = (userId: string) => `${ACTIVE_PREFIX}${userId}`;
export const lastTurnKey = (userId: string) => `${LAST_TURN_PREFIX}${userId}`;

const asChatId = (value: string | null): string | null =>
  value !== null && UUID.test(value) ? value : null;

/** The remembered chat for this person, or null. Storage that throws counts as empty. */
export function readActiveChat(storage: ChatStorage, userId: string): string | null {
  try {
    return asChatId(storage.getItem(activeChatKey(userId)));
  } catch {
    return null;
  }
}

/** Remembers the open chat, or forgets it with null. Never throws. */
export function writeActiveChat(storage: ChatStorage, userId: string, id: string | null): void {
  try {
    if (id === null) storage.removeItem(activeChatKey(userId));
    else storage.setItem(activeChatKey(userId), id);
  } catch {
    // Storage can be blocked. The chat still works in this tab.
  }
}

/** Tells other tabs that a turn finished. Never throws. */
export function markTurnFinished(storage: ChatStorage, userId: string, now: number): void {
  try {
    storage.setItem(lastTurnKey(userId), String(now));
  } catch {
    // Other tabs simply catch up on their next load.
  }
}

export type SyncDecision = { kind: "none" } | { kind: "clear" } | { kind: "load"; id: string };

type StorageChange = { key: string | null; newValue: string | null };
type SyncContext = {
  userId: string;
  /** This tab is waiting for an answer, so it is never interrupted. */
  sending: boolean;
  currentId: string | null;
  /** The remembered chat right now, read after the change. */
  storedActiveId: string | null;
};

const NONE: SyncDecision = { kind: "none" };

/**
 * What this tab should do after another tab changed storage: follow a different open chat,
 * clear when the other tab started a new chat, or reload the open chat after a finished turn.
 */
export function decideStorageSync(change: StorageChange, ctx: SyncContext): SyncDecision {
  if (ctx.sending) return NONE;
  if (change.key === activeChatKey(ctx.userId)) {
    const id = asChatId(change.newValue);
    if (id === null) return ctx.currentId === null ? NONE : { kind: "clear" };
    return id === ctx.currentId ? NONE : { kind: "load", id };
  }
  if (change.key === lastTurnKey(ctx.userId)) {
    const active = ctx.storedActiveId;
    if (active === null) return NONE;
    return ctx.currentId === null || ctx.currentId === active ? { kind: "load", id: active } : NONE;
  }
  return NONE;
}
