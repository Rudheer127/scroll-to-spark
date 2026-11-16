import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  cursorFilter,
  decodeCursor,
  encodeCursor,
  filtersToParams,
  hasActiveFilters,
  parseFilters,
  toTsQuery,
} from "@/features/inspire/filters";

const ID = "11111111-2222-4333-8444-555555555555";

describe("parseFilters", () => {
  it("falls back to defaults for an empty or hostile URL", () => {
    expect(parseFilters({})).toEqual(DEFAULT_FILTERS);
    expect(
      parseFilters({ effort: "huge", minutes: "7", sort: "random", group: "A B;", tab: "x" }),
    ).toEqual(DEFAULT_FILTERS);
  });

  it("reads every filter and round-trips through the URL", () => {
    const filters = parseFilters({
      q: "  vote   early ",
      effort: "tiny",
      group: "city-hall",
      minutes: "15",
      thanks: "1",
      sort: "inspiring",
      tab: "saved",
    });
    expect(filters).toEqual({
      q: "vote early",
      effort: "tiny",
      group: "city-hall",
      minutes: 15,
      thanks: true,
      sort: "inspiring",
      tab: "saved",
    });
    expect(parseFilters(Object.fromEntries(filtersToParams(filters)))).toEqual(filters);
  });

  it("keeps the plain page's URL plain", () => {
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe("");
  });
});

describe("hasActiveFilters", () => {
  it("ignores the tab but counts everything else", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, tab: "saved" })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, thanks: true })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: "inspiring" })).toBe(true);
  });
});

describe("toTsQuery", () => {
  it("builds a prefix query from words", () => {
    expect(toTsQuery("Vote reg")).toBe("vote:* & reg:*");
  });
  it("drops anything that could change the query", () => {
    expect(toTsQuery("a'; drop & | ! ( ) :*")).toBe("a:* & drop:*");
    expect(toTsQuery("   ")).toBeNull();
    expect(toTsQuery("&|!")).toBeNull();
  });
  it("caps the number of words", () => {
    expect(toTsQuery("a b c d e f g h")?.split(" & ")).toHaveLength(6);
  });
});

describe("cursors", () => {
  it("round-trips and rejects junk", () => {
    const cursor = { created: "2026-11-16T10:00:00.123456+00:00", id: ID, inspired: 3 };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
    expect(decodeCursor("not-a-cursor")).toBeNull();
    expect(decodeCursor(null)).toBeNull();
    const bad = Buffer.from(JSON.stringify({ created: "x", id: "y" })).toString("base64url");
    expect(decodeCursor(bad)).toBeNull();
  });

  it("continues strictly after the last row for each sort", () => {
    const base = { created: "2026-11-16T10:00:00+00:00", id: ID };
    expect(cursorFilter(base, "newest")).toBe(
      `created_at.lt."${base.created}",and(created_at.eq."${base.created}",id.lt.${ID})`,
    );
    expect(cursorFilter({ ...base, inspired: 2 }, "inspiring")).toContain("inspired_count.lt.2");
  });
});
