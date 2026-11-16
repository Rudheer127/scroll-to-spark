import { beforeEach, describe, expect, it, vi } from "vitest";

type Call = { table: string; op: string; payload?: unknown; filters: [string, unknown][] };

const state = vi.hoisted(() => ({
  userId: "user-1" as string | null,
  calls: [] as Call[],
  error: null as { code: string } | null,
  /** Rows an update reports back. Empty means nothing changed. */
  changed: [{ id: "row" }] as { id: string }[],
}));

function builder(table: string) {
  const call: Call = { table, op: "select", filters: [] };
  const chain: Record<string, unknown> = {};
  const finish = () => {
    state.calls.push(call);
    return { error: state.error, data: state.changed };
  };
  chain.insert = (payload: unknown) => {
    call.op = "insert";
    call.payload = payload;
    return Promise.resolve(finish());
  };
  chain.update = (payload: unknown) => {
    call.op = "update";
    call.payload = payload;
    return chain;
  };
  chain.select = () => chain;
  chain.delete = () => {
    call.op = "delete";
    return chain;
  };
  chain.eq = (column: string, value: unknown) => {
    call.filters.push([column, value]);
    return chain;
  };
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(finish()).then(resolve);
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null } }) },
    from: builder,
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/inspire/queries", () => ({
  getFeedPage: vi.fn(async () => ({ posts: [], nextCursor: null })),
}));

import { setInspired, setSaved, setSharing } from "@/features/inspire/actions";

const ID = "11111111-2222-4333-8444-555555555555";

beforeEach(() => {
  state.userId = "user-1";
  state.calls = [];
  state.error = null;
  state.changed = [{ id: "row" }];
});

describe("setSharing", () => {
  it("asks people to sign in", async () => {
    state.userId = null;
    const result = await setSharing({
      completionId: ID,
      sharePublicly: true,
      shareThankYou: false,
    });
    expect(result).toMatchObject({ ok: false });
    expect(state.calls).toHaveLength(0);
  });

  it("updates only the caller's own row", async () => {
    const result = await setSharing({ completionId: ID, sharePublicly: true, shareThankYou: true });
    expect(result.ok).toBe(true);
    expect(state.calls[0]).toMatchObject({
      table: "task_completions",
      op: "update",
      payload: { share_publicly: true, share_thank_you: true },
    });
    expect(state.calls[0].filters).toEqual([
      ["id", ID],
      ["user_id", "user-1"],
    ]);
  });

  it("turning sharing off also turns the thank-you off", async () => {
    await setSharing({ completionId: ID, sharePublicly: false, shareThankYou: true });
    expect(state.calls[0].payload).toEqual({ share_publicly: false, share_thank_you: false });
  });

  it("rejects a bad id without touching the database", async () => {
    const result = await setSharing({
      completionId: "x",
      sharePublicly: true,
      shareThankYou: true,
    });
    expect(result.ok).toBe(false);
    expect(state.calls).toHaveLength(0);
  });

  it("fails when no row was changed, instead of reporting a save that did not happen", async () => {
    state.changed = [];
    const result = await setSharing({
      completionId: ID,
      sharePublicly: true,
      shareThankYou: false,
    });
    expect(result.ok).toBe(false);
  });

  it("reports a database failure", async () => {
    state.error = { code: "42501" };
    const result = await setSharing({
      completionId: ID,
      sharePublicly: true,
      shareThankYou: false,
    });
    expect(result.ok).toBe(false);
  });
});

describe("setInspired and setSaved", () => {
  it("inserts and deletes the person's own row", async () => {
    await setInspired({ completionId: ID, on: true });
    expect(state.calls[0]).toMatchObject({
      table: "inspiration_reactions",
      op: "insert",
      payload: { user_id: "user-1", completion_id: ID },
    });
    await setSaved({ completionId: ID, on: false });
    expect(state.calls[1]).toMatchObject({ table: "inspiration_saves", op: "delete" });
    expect(state.calls[1].filters).toContainEqual(["user_id", "user-1"]);
  });

  it("treats a repeat tap as success", async () => {
    state.error = { code: "23505" };
    expect((await setInspired({ completionId: ID, on: true })).ok).toBe(true);
  });
});
