import { describe, expect, it } from "vitest";
import {
  districtLabel,
  filterOfficials,
  formatMoney,
  levelsPresent,
  termEndLabel,
} from "@/features/officials/filters";
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
    expect(termEndLabel("2031-01-03")).toBe("Term ends Jan 3, 2031");
    expect(termEndLabel(null)).toBeNull();
    expect(districtLabel(all[1])).toBe("WA-9");
    expect(districtLabel({ ...all[1], district: 0 })).toBe("WA at large");
  });
  it("formats money", () => {
    expect(formatMoney(1234.5)).toBe("$1,235");
    expect(formatMoney(2_500_000)).toBe("$2.5M");
  });
});
