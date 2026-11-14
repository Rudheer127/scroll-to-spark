import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { searchOpportunities } from "@/features/guide/tools/search-opportunities";
import {
  getMyContributions,
  summarizeContributions,
} from "@/features/guide/tools/get-contributions";
import { lookupEvidence } from "@/features/guide/tools/lookup-evidence";
import type { ContributionRow } from "@/features/guide/types";

type Call = { method: string; args: unknown[] };

/** The ONE place a fake query builder is cast to the typed client. */
function fakeDb(data: unknown[], error: { message: string } | null = null) {
  const calls: Call[] = [];
  const builder: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown) => resolve({ data, error }),
  };
  for (const method of ["select", "eq", "in", "or", "order", "limit", "textSearch"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  const from = (table: string) => {
    calls.push({ method: "from", args: [table] });
    return builder;
  };
  return { db: { from } as unknown as SupabaseClient<Database>, calls };
}

const oppRow = (id: string) => ({
  id,
  title: `Task ${id}`,
  description: null,
  effort: "tiny",
  minutes: 10,
  place: "home",
  reply_within_hours: 48,
  groups: { name: "Org" },
});

const contribution = (over: Partial<ContributionRow>): ContributionRow => ({
  id: "c",
  user_id: "u",
  title: "t",
  description: null,
  minutes: 30,
  occurred_on: "2026-01-01",
  verification: "self",
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("searchOpportunities", () => {
  it("maps rows, caps at 5 and only reads open tasks", async () => {
    const { db, calls } = fakeDb(Array.from({ length: 8 }, (_, i) => oppRow(String(i))));
    const rows = await searchOpportunities(db, { effort: null, remoteOnly: false, keyword: null });
    expect(rows.length).toBe(5);
    expect(rows[0]).toMatchObject({ org_name: "Org", effort: "tiny" });
    expect(calls).toContainEqual({ method: "from", args: ["tasks"] });
    expect(calls).toContainEqual({ method: "eq", args: ["is_open", true] });
    expect(calls).toContainEqual({ method: "limit", args: [5] });
    expect(calls.some((c) => JSON.stringify(c).includes("is_demo") && c.method === "eq")).toBe(
      false,
    );
  });

  it("filters remote to home or either, and by effort", async () => {
    const { db, calls } = fakeDb([]);
    await searchOpportunities(db, { effort: "big", remoteOnly: true, keyword: null });
    expect(calls).toContainEqual({ method: "in", args: ["place", ["home", "either"]] });
    expect(calls).toContainEqual({ method: "eq", args: ["effort", "big"] });
  });

  it("escapes keyword wildcards and ignores keywords over 100 chars", async () => {
    const a = fakeDb([]);
    await searchOpportunities(a.db, { effort: null, remoteOnly: false, keyword: "50%_a\\b" });
    const or = a.calls.find((c) => c.method === "or");
    expect(or?.args[0]).toBe("title.ilike.%50\\%\\_a\\\\b%,description.ilike.%50\\%\\_a\\\\b%");
    const b = fakeDb([]);
    await searchOpportunities(b.db, {
      effort: null,
      remoteOnly: false,
      keyword: "x".repeat(101),
    });
    expect(b.calls.some((c) => c.method === "or")).toBe(false);
  });

  it("throws a readable error when the query fails", async () => {
    const { db } = fakeDb([], { message: "boom" });
    await expect(
      searchOpportunities(db, { effort: null, remoteOnly: false, keyword: null }),
    ).rejects.toThrow("boom");
  });
});

describe("getMyContributions", () => {
  it("takes no user id and orders newest first with a limit", async () => {
    const { db, calls } = fakeDb([contribution({})]);
    const rows = await getMyContributions(db);
    expect(rows).toHaveLength(1);
    expect(calls).toContainEqual({
      method: "order",
      args: ["occurred_on", { ascending: false }],
    });
    expect(calls).toContainEqual({ method: "limit", args: [200] });
    expect(calls.some((c) => c.method === "eq")).toBe(false);
  });

  it("rejects a second argument at the type level", () => {
    const { db } = fakeDb([]);
    // @ts-expect-error getMyContributions must not accept a user id
    void getMyContributions(db, "some-user-id");
  });
});

describe("summarizeContributions", () => {
  it("returns zeros for no rows", () => {
    expect(summarizeContributions([])).toEqual({
      count: 0,
      totalMinutes: 0,
      totalHours: 0,
      firstDate: null,
      titles: [],
    });
  });

  it("totals 90 minutes as 1.5 hours and finds the earliest date", () => {
    const s = summarizeContributions([
      contribution({ minutes: 60, occurred_on: "2026-03-02", title: "B" }),
      contribution({ minutes: 30, occurred_on: "2026-01-05", title: "A" }),
    ]);
    expect(s).toMatchObject({
      count: 2,
      totalMinutes: 90,
      totalHours: 1.5,
      firstDate: "2026-01-05",
    });
    expect(s.titles).toEqual(["B", "A"]);
  });

  it("keeps up to 5 distinct recent titles and rounds hours to 1 decimal", () => {
    const rows = ["a", "a", "b", "c", "d", "e", "f"].map((title, i) =>
      contribution({ title, minutes: 10, occurred_on: `2026-02-0${7 - i}` }),
    );
    const s = summarizeContributions(rows);
    expect(s.titles).toEqual(["a", "b", "c", "d", "e"]);
    expect(s.totalHours).toBe(1.2);
  });
});

describe("lookupEvidence", () => {
  it("returns [] without querying for empty or whitespace queries", async () => {
    const { db, calls } = fakeDb([]);
    expect(await lookupEvidence(db, "")).toEqual([]);
    expect(await lookupEvidence(db, "   ")).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("returns [] without querying for queries over 200 chars", async () => {
    const { db, calls } = fakeDb([]);
    expect(await lookupEvidence(db, "a".repeat(201))).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("uses websearch full text search on fts and caps at 4", async () => {
    const { db, calls } = fakeDb([{ id: "1" }]);
    await lookupEvidence(db, "  volunteering wellbeing ");
    expect(calls).toContainEqual({
      method: "textSearch",
      args: ["fts", "volunteering wellbeing", { type: "websearch", config: "english" }],
    });
    expect(calls).toContainEqual({ method: "limit", args: [4] });
  });
});
