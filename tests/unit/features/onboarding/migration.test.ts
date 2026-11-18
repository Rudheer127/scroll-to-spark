import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/20261115030000_onboarding.sql", "utf8");

describe("onboarding migration", () => {
  it("adds the columns with limits", () => {
    for (const text of [
      "onboarded_at timestamptz",
      "age_confirmed_at timestamptz",
      "between 5 and 600",
      "'home', 'in_person', 'either'",
      "cardinality(interests) <= 8",
      "char_length(needs) <= 300",
    ]) {
      expect(sql).toContain(text);
    }
  });

  it("grants update on exactly the new columns and does not widen anything else", () => {
    const grants = sql.match(/grant update \(([^)]*)\)/g) ?? [];
    expect(grants).toHaveLength(1);
    expect(grants[0]?.replace(/\s+/g, " ")).toBe(
      "grant update (onboarded_at, age_confirmed_at, minutes_per_week, place_pref, interests, needs)",
    );
    expect(sql).not.toMatch(/grant (all|insert|delete)/i);
  });
});
