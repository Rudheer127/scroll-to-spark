import { describe, expect, it } from "vitest";
import {
  districtLabel,
  filterOfficials,
  collapseHouse,
  formatMoney,
  levelsPresent,
  orderOfficials,
  termEndLabel,
} from "@/features/officials/filters";
import type { Official } from "@/features/officials/types";
import { normalizeFederal, normalizeOpenStates } from "@/features/officials/normalize";
import legislators from "./fixtures/legislators.json";
import openstates from "./fixtures/openstates.json";

const all = [...normalizeFederal(legislators, []), ...normalizeOpenStates(openstates, "WA")];
const none = { level: null, query: "", district: null } as const;

describe("filterOfficials", () => {
  it("filters by level", () => {
    expect(filterOfficials(all, { ...none, level: "state" })).toHaveLength(2);
    expect(filterOfficials(all, { ...none, level: "federal" })).toHaveLength(2);
  });
  it("searches name and office, ignoring case", () => {
    expect(filterOfficials(all, { ...none, query: "cantwell" })).toHaveLength(1);
    expect(filterOfficials(all, { ...none, query: "SENATOR" }).length).toBeGreaterThanOrEqual(2);
  });
  it("narrows House members to one district but keeps senators", () => {
    const names = filterOfficials(all, { ...none, level: "federal", district: 3 }).map(
      (o) => o.name,
    );
    expect(names).toEqual(["Maria Cantwell"]);
    expect(filterOfficials(all, { ...none, level: "federal", district: 9 })).toHaveLength(2);
  });
  it("lists which levels exist", () => {
    expect(levelsPresent(all)).toEqual(["federal", "state"]);
  });
});

describe("labels", () => {
  it("formats term end and districts", () => {
    expect(termEndLabel("2031-01-03", new Date("2026-11-16"))).toBe("Term ends Jan 3, 2031");
    expect(termEndLabel(null)).toBeNull();
    expect(districtLabel(all[1])).toBe("WA-9");
    expect(districtLabel({ ...all[1], district: 0 })).toBe("WA at large");
  });
  it("says a term ended once its end date has passed", () => {
    const now = new Date("2026-11-16T12:00:00Z");
    expect(termEndLabel("2026-01-03", now)).toBe("Term ended Jan 3, 2026");
    expect(termEndLabel("2026-11-16", now)).toBe("Term ends Nov 16, 2026"); // runs through its last day
    expect(termEndLabel("2026-11-15", now)).toBe("Term ended Nov 15, 2026");
  });
  it("never shows a missing figure as zero", () => {
    expect(formatMoney(null)).toBe("Not reported");
    expect(formatMoney(undefined)).toBe("Not reported");
    expect(formatMoney(0)).toBe("$0");
  });
  it("formats money", () => {
    expect(formatMoney(1234.5)).toBe("$1,235");
    expect(formatMoney(2_500_000)).toBe("$2.5M");
  });
});

function person(over: Partial<Official>): Official {
  return {
    id: "x",
    level: "federal",
    name: "Name",
    office: "U.S. Representative",
    state: "NY",
    district: 1,
    party: "Democrat",
    termEnd: null,
    photoUrl: null,
    phone: null,
    email: null,
    website: null,
    contactForm: null,
    address: null,
    socials: [],
    fecId: null,
    bioguide: null,
    isSenator: false,
    ...over,
  };
}

describe("orderOfficials and collapseHouse", () => {
  const senatorB = person({ id: "s2", name: "B Senator", isSenator: true, district: null });
  const senatorA = person({ id: "s1", name: "A Senator", isSenator: true, district: null });
  const d3 = person({ id: "h3", name: "Zed", district: 3 });
  const d12 = person({ id: "h12", name: "Amy", district: 12 });
  const d7 = person({ id: "h7", name: "Bob", district: 7 });
  const stateRep = person({ id: "st", level: "state", name: "State Rep", district: "5" });
  const mixed = [stateRep, d12, d3, senatorB, d7, senatorA];

  it("puts senators first, then the likely district, then districts in number order", () => {
    expect(orderOfficials(mixed, 12).map((o) => o.id)).toEqual([
      "s1",
      "s2",
      "h12",
      "h3",
      "h7",
      "st",
    ]);
  });
  it("orders by district number when no district is likely", () => {
    expect(orderOfficials(mixed, null).map((o) => o.id)).toEqual([
      "s1",
      "s2",
      "h3",
      "h7",
      "h12",
      "st",
    ]);
  });
  it("folds other districts away and counts them", () => {
    const ordered = orderOfficials(mixed, 12);
    const { shown, hidden } = collapseHouse(ordered, { likelyDistrict: 12, collapse: true });
    expect(hidden).toBe(2);
    expect(shown.map((o) => o.id)).toEqual(["s1", "s2", "h12", "st"]);
  });
  it("hides nothing when asked not to, or when no district is likely", () => {
    const ordered = orderOfficials(mixed, 12);
    expect(collapseHouse(ordered, { likelyDistrict: 12, collapse: false })).toEqual({
      shown: ordered,
      hidden: 0,
    });
    expect(collapseHouse(ordered, { likelyDistrict: null, collapse: true }).hidden).toBe(0);
  });
});
