import { describe, expect, it } from "vitest";
import {
  bioguidePhoto,
  fecCandidateUrl,
  normalizeFederal,
  normalizeFunding,
  normalizeOpenStates,
  partyTone,
  safeUrl,
  socialUrl,
} from "@/features/officials/normalize";
import legislators from "./fixtures/legislators.json";
import social from "./fixtures/social.json";
import openstates from "./fixtures/openstates.json";
import totals from "./fixtures/fec-totals.json";
import employers from "./fixtures/fec-employers.json";

describe("normalizeFederal", () => {
  const officials = normalizeFederal(legislators, social);

  it("keeps valid members and skips broken rows", () => {
    expect(officials.map((o) => o.bioguide)).toEqual(["C000127", "S000510"]);
  });

  it("uses the latest term for a senator who was once a representative", () => {
    const cantwell = officials[0];
    expect(cantwell).toMatchObject({
      id: "federal:C000127",
      level: "federal",
      office: "U.S. Senator",
      isSenator: true,
      district: null,
      termEnd: "2031-01-03",
      fecId: "S8WA00194",
      phone: "202-224-3441",
    });
    expect(cantwell.photoUrl).toBe(bioguidePhoto("C000127"));
  });

  it("joins social accounts and drops handles with odd characters", () => {
    expect(officials[0].socials).toEqual([{ network: "twitter", handle: "SenatorCantwell" }]);
    expect(socialUrl(officials[0].socials[0])).toBe("https://x.com/SenatorCantwell");
  });

  it("picks the House candidate id and drops an unsafe website", () => {
    expect(officials[1]).toMatchObject({
      office: "U.S. Representative",
      district: 9,
      fecId: "H6WA09068",
      website: null,
    });
  });

  it("returns nothing for a non-array", () => {
    expect(normalizeFederal({}, null)).toEqual([]);
  });
});

describe("safeUrl", () => {
  it("allows only http(s)", () => {
    expect(safeUrl("https://a.gov/x")).toBe("https://a.gov/x");
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("not a url")).toBeNull();
    expect(safeUrl(undefined)).toBeNull();
  });
});

describe("normalizeOpenStates", () => {
  const officials = normalizeOpenStates(openstates, "WA");

  it("keeps legislators and skips other roles", () => {
    expect(officials.map((o) => o.name)).toEqual(["Jane Roe", "John Doe"]);
  });

  it("maps chamber, district, contact and https-only photos", () => {
    expect(officials[0]).toMatchObject({
      level: "state",
      isSenator: true,
      district: "43",
      phone: "360-786-0000",
      email: "jane@leg.example.gov",
      photoUrl: "https://example.org/jane.jpg",
      state: "WA",
    });
    expect(officials[1].photoUrl).toBeNull();
    expect(officials[1].office).toBe("Representative");
  });

  it("copes with a malformed answer", () => {
    expect(normalizeOpenStates({ nope: 1 }, "WA")).toEqual([]);
  });
});

describe("normalizeFunding", () => {
  it("summarises totals and hides non-answer employers", () => {
    const funding = normalizeFunding("S8WA00194", "Maria Cantwell", totals, employers);
    expect(funding).toMatchObject({
      cycle: 2026,
      receipts: 985139.34,
      coverageEnd: "2026-09-30",
      fecUrl: fecCandidateUrl("S8WA00194"),
    });
    expect(funding?.topEmployers).toEqual([
      { employer: "T-MOBILE", total: 99267.55 },
      { employer: "MICROSOFT", total: 50000 },
    ]);
  });

  it("returns null with no totals, and works without employers", () => {
    expect(normalizeFunding("S1", "X", { results: [] }, null)).toBeNull();
    expect(normalizeFunding("S1", "X", totals, null)?.topEmployers).toEqual([]);
  });
});

describe("partyTone", () => {
  it("groups the two big parties", () => {
    expect(partyTone("Democrat")).toBe("blue");
    expect(partyTone("Republican")).toBe("red");
    expect(partyTone("Independent")).toBe("other");
  });
});
