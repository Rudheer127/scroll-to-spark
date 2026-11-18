import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/20261118010000_profile_first_last_name.sql", "utf8");

describe("first and last name migration", () => {
  it("adds nullable, length-limited columns and grants update on only those two", () => {
    expect(sql).toContain("add column first_name text check");
    expect(sql).toContain("add column last_name text check");
    expect(sql).toContain(
      "grant update (first_name, last_name) on public.profiles to authenticated",
    );
    expect(sql).not.toMatch(/grant (all|insert|delete)/i);
  });
});
