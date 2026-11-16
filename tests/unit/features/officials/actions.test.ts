import { beforeEach, describe, expect, it, vi } from "vitest";

type Call = { op: string; payload?: unknown; filters: [string, unknown][] };
const state = vi.hoisted(() => ({
  userId: "user-1" as string | null,
  calls: [] as Call[],
  insertError: null as { code: string } | null,
  rows: [] as { zip: string; city: string; state: string }[],
}));

function builder() {
  const call: Call = { op: "select", filters: [] };
  const chain: Record<string, unknown> = {};
  const finish = () => {
    state.calls.push(call);
    if (call.op === "insert") return { error: state.insertError };
    if (call.op === "select") return { data: state.rows };
    return { error: null };
  };
  chain.insert = (payload: unknown) => {
    call.op = "insert";
    call.payload = payload;
    return Promise.resolve(finish());
  };
  chain.update = () => ((call.op = "update"), chain);
  chain.delete = () => ((call.op = "delete"), chain);
  chain.select = () => chain;
  chain.order = () => chain;
  chain.eq = (c: string, v: unknown) => (call.filters.push([c, v]), chain);
  chain.in = (c: string, v: unknown) => (call.filters.push([c, v]), chain);
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(finish()).then(resolve);
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null } }) },
    from: builder,
  }),
}));
vi.mock("@/features/events/location", () => ({
  lookupZip: async (zip: string) =>
    zip === "00000" ? null : { zip, city: "Tempe", region: "AZ", lat: 33.4, lng: -111.9 },
  zipFromCoords: async () => "85281",
}));
vi.mock("@/features/officials/source", () => ({
  districtFromCoords: async () => 4,
  getFederalForState: async () => ({
    officials: [{ id: "federal:A", level: "federal", isSenator: true, district: null }],
    districtCount: 9,
  }),
  getStateLegislators: async () => [],
  hasOpenStatesKey: () => false,
  findFederalByBioguide: async () => null,
  loadFunding: async () => null,
}));
vi.mock("@/features/officials/queries", () => ({ LOOKUPS_KEEP: 10 }));

import {
  clearLookupHistory,
  getFunding,
  lookupOfficials,
  removeLookup,
  saveLookup,
} from "@/features/officials/actions";

beforeEach(() => {
  state.userId = "user-1";
  state.calls = [];
  state.insertError = null;
  state.rows = [];
});

describe("lookupOfficials", () => {
  it("needs a signed-in user", async () => {
    state.userId = null;
    const r = await lookupOfficials({ zip: "85281" });
    expect(r.ok).toBe(false);
  });
  it("rejects a bad ZIP with a field error", async () => {
    const r = await lookupOfficials({ zip: "12" });
    expect(r).toMatchObject({ ok: false, fieldErrors: { zip: expect.any(String) } });
  });
  it("reports an unknown ZIP", async () => {
    const r = await lookupOfficials({ zip: "00000" });
    expect(r).toMatchObject({ ok: false });
  });
  it("lets the person choose a district for a typed ZIP, and flags missing keys", async () => {
    const r = await lookupOfficials({ zip: "85281" });
    expect(r.ok && r.data).toMatchObject({
      houseMode: "choose",
      likelyDistrict: 4,
      stateStatus: "missing-key",
      stateApproximate: true,
    });
    expect(state.calls.some((c) => c.op === "insert")).toBe(true);
  });
  it("is exact for a browser location", async () => {
    const r = await lookupOfficials({ lat: 33.42, lng: -111.91 });
    expect(r.ok && r.data).toMatchObject({ houseMode: "exact", stateApproximate: false });
  });
});

describe("history", () => {
  it("bumps an existing ZIP instead of failing", async () => {
    state.insertError = { code: "23505" };
    const r = await saveLookup({ zip: "85281", city: "Tempe", state: "AZ" });
    expect(r.ok).toBe(true);
    expect(state.calls.some((c) => c.op === "update")).toBe(true);
  });
  it("keeps only the newest ten", async () => {
    state.rows = Array.from({ length: 12 }, (_, i) => ({
      zip: String(10000 + i),
      city: "X",
      state: "AZ",
    }));
    const r = await saveLookup({ zip: "10000", city: "X", state: "AZ" });
    expect(r.ok && r.data.lookups).toHaveLength(10);
    const del = state.calls.find((c) => c.op === "delete");
    expect(del?.filters).toContainEqual(["zip", ["10010", "10011"]]);
  });
  it("removes one ZIP or all of them, scoped to the user", async () => {
    await removeLookup("85281");
    await clearLookupHistory();
    const deletes = state.calls.filter((c) => c.op === "delete");
    expect(deletes).toHaveLength(2);
    expect(
      deletes.every((c) => c.filters.some(([k, v]) => k === "user_id" && v === "user-1")),
    ).toBe(true);
    expect(await removeLookup("bad")).toMatchObject({ ok: false });
  });
});

describe("getFunding", () => {
  it("rejects a malformed id and returns null funding for unknown officials", async () => {
    expect(await getFunding("nope")).toMatchObject({ ok: false });
    expect(await getFunding("C000127")).toEqual({ ok: true, data: { funding: null } });
  });
});
