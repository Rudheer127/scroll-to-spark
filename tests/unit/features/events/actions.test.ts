import { beforeEach, describe, expect, it, vi } from "vitest";

type Call = { table: string; op: string; payload?: unknown; filters: [string, unknown][] };

const state = vi.hoisted(() => ({
  userId: "user-1" as string | null,
  calls: [] as Call[],
  insertError: null as { code: string } | null,
  updateError: null as { code: string } | null,
  rsvpRow: null as { title: string; starts_at: string; status: string } | null,
  existingContribution: false,
  contributionError: null as { code: string } | null,
}));

function builder(table: string) {
  const call: Call = { table, op: "select", filters: [] };
  const chain: Record<string, unknown> = {};
  const finish = () => {
    state.calls.push(call);
    if (call.op === "insert") {
      return { error: table === "contributions" ? state.contributionError : state.insertError };
    }
    if (call.op === "update") return { error: state.updateError };
    if (call.op === "delete") return { error: null };
    if (table === "contributions") {
      return { data: state.existingContribution ? [{ id: "c1" }] : [] };
    }
    return { data: state.rsvpRow };
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
  chain.delete = () => {
    call.op = "delete";
    return chain;
  };
  chain.select = () => chain;
  chain.eq = (column: string, value: unknown) => {
    call.filters.push([column, value]);
    return chain;
  };
  chain.limit = () => Promise.resolve(finish());
  chain.maybeSingle = () => Promise.resolve(finish());
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(finish()).then(resolve);
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null } }) },
    from: builder,
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/features/events/source", () => ({
  getEvents: vi.fn(async () => ({ kind: "live", events: [] })),
}));
vi.mock("@/features/events/location", () => ({
  lookupZip: vi.fn(async (zip: string) =>
    zip === "85281" ? { zip, city: "Tempe", region: "AZ", lat: 33.42, lng: -111.93 } : null,
  ),
  zipFromCoords: vi.fn(async () => "85281"),
}));

import {
  findNearby,
  logAttendedContribution,
  removeRsvp,
  setRsvp,
} from "@/features/events/actions";
import { getEvents } from "@/features/events/source";
import { zipFromCoords } from "@/features/events/location";

const PAST = new Date(Date.now() - 86_400_000).toISOString();
const FUTURE = new Date(Date.now() + 86_400_000).toISOString();

function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    eventKey: "mobilize:10:20",
    title: "Park cleanup",
    organizer: "Group",
    url: "https://www.mobilize.us/g/event/10/",
    startsAt: FUTURE,
    timezone: "America/Phoenix",
    isVirtual: false,
    city: "Tempe",
    ...overrides,
  };
}

beforeEach(() => {
  state.userId = "user-1";
  state.calls = [];
  state.insertError = null;
  state.updateError = null;
  state.rsvpRow = null;
  state.existingContribution = false;
  state.contributionError = null;
  vi.clearAllMocks();
});

describe("findNearby", () => {
  it("needs a signed-in person", async () => {
    state.userId = null;
    expect((await findNearby({ zip: "85281" })).ok).toBe(false);
  });

  it("looks up a typed ZIP and loads its events", async () => {
    const result = await findNearby({ zip: "85281" });
    expect(result.ok && result.data.location.city).toBe("Tempe");
    expect(getEvents).toHaveBeenCalledWith("85281");
    expect(zipFromCoords).not.toHaveBeenCalled();
  });

  it("turns browser coordinates into a ZIP", async () => {
    const result = await findNearby({ lat: 33.42, lng: -111.93 });
    expect(result.ok).toBe(true);
    expect(zipFromCoords).toHaveBeenCalledWith(33.42, -111.93);
  });

  it.each([["8528"], ["abcde"], [""]])("rejects the ZIP %j", async (zip) => {
    const result = await findNearby({ zip });
    expect(result.ok).toBe(false);
    expect(getEvents).not.toHaveBeenCalled();
  });

  it("says so when the ZIP is unknown", async () => {
    const result = await findNearby({ zip: "00000" });
    expect(!result.ok && result.error).toMatch(/could not find/i);
  });
});

describe("setRsvp", () => {
  it("saves an RSVP for the signed-in user only, with no server-owned columns", async () => {
    const result = await setRsvp({ event: snapshot(), status: "going" });
    expect(result).toMatchObject({ ok: true, data: { status: "going" } });
    const insert = state.calls.find((c) => c.op === "insert");
    expect(insert?.payload).toMatchObject({
      user_id: "user-1",
      event_key: "mobilize:10:20",
      status: "going",
    });
    expect(Object.keys(insert?.payload as object)).not.toContain("id");
    expect(Object.keys(insert?.payload as object)).not.toContain("created_at");
  });

  it("needs sign-in", async () => {
    state.userId = null;
    expect((await setRsvp({ event: snapshot(), status: "going" })).ok).toBe(false);
    expect(state.calls).toHaveLength(0);
  });

  it("changes only the status when the event is already saved", async () => {
    state.insertError = { code: "23505" };
    const result = await setRsvp({ event: snapshot({ startsAt: PAST }), status: "attended" });
    expect(result.ok).toBe(true);
    const update = state.calls.find((c) => c.op === "update");
    expect(update?.payload).toEqual({ status: "attended" });
    expect(update?.filters).toEqual([
      ["user_id", "user-1"],
      ["event_key", "mobilize:10:20"],
    ]);
  });

  it("will not mark an event attended before it starts", async () => {
    const result = await setRsvp({ event: snapshot({ startsAt: FUTURE }), status: "attended" });
    expect(!result.ok && result.error).toMatch(/after it has started/i);
    expect(state.calls).toHaveLength(0);
  });

  it.each([
    ["a sample event key", { eventKey: "sample:1" }],
    ["a link off mobilize.us", { url: "https://evil.example/" }],
    ["a javascript link", { url: "javascript:alert(1)" }],
    ["an empty title", { title: "  " }],
  ])("rejects %s", async (_name, overrides) => {
    const result = await setRsvp({ event: snapshot(overrides), status: "going" });
    expect(result.ok).toBe(false);
    expect(state.calls).toHaveLength(0);
  });

  it("reports a database failure in plain words", async () => {
    state.insertError = { code: "XX000" };
    const result = await setRsvp({ event: snapshot(), status: "going" });
    expect(!result.ok && result.error).toMatch(/could not save/i);
  });
});

describe("removeRsvp", () => {
  it("deletes only the caller's row for that event", async () => {
    const result = await removeRsvp("mobilize:10:20");
    expect(result.ok).toBe(true);
    const del = state.calls.find((c) => c.op === "delete");
    expect(del?.filters).toEqual([
      ["user_id", "user-1"],
      ["event_key", "mobilize:10:20"],
    ]);
  });

  it("rejects a bad key and needs sign-in", async () => {
    expect((await removeRsvp("nope")).ok).toBe(false);
    state.userId = null;
    expect((await removeRsvp("mobilize:10:20")).ok).toBe(false);
  });
});

describe("logAttendedContribution", () => {
  const input = { eventKey: "mobilize:10:20", minutes: 90 };

  it("needs an attended RSVP first", async () => {
    state.rsvpRow = { title: "Park cleanup", starts_at: PAST, status: "going" };
    const result = await logAttendedContribution(input);
    expect(!result.ok && result.error).toMatch(/attended first/i);
    expect(state.calls.some((c) => c.table === "contributions" && c.op === "insert")).toBe(false);
  });

  it("adds a self-reported contribution without sending a verification value", async () => {
    state.rsvpRow = { title: "Park cleanup", starts_at: PAST, status: "attended" };
    const result = await logAttendedContribution(input);
    expect(result.ok).toBe(true);
    const insert = state.calls.find((c) => c.table === "contributions" && c.op === "insert");
    expect(insert?.payload).toMatchObject({
      user_id: "user-1",
      title: "Went to Park cleanup",
      minutes: 90,
      occurred_on: PAST.slice(0, 10),
    });
    expect(Object.keys(insert?.payload as object)).not.toContain("verification");
  });

  it("does not add the same event twice", async () => {
    state.rsvpRow = { title: "Park cleanup", starts_at: PAST, status: "attended" };
    state.existingContribution = true;
    const result = await logAttendedContribution(input);
    expect(result).toMatchObject({ ok: true, message: "Already added." });
    expect(state.calls.some((c) => c.table === "contributions" && c.op === "insert")).toBe(false);
  });

  it("rejects bad minutes", async () => {
    expect((await logAttendedContribution({ ...input, minutes: 0 })).ok).toBe(false);
    expect((await logAttendedContribution({ ...input, minutes: 99999 })).ok).toBe(false);
  });
});
