import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20261116020000_officials_lookups.sql"),
  "utf8",
);

describe("officials_lookups migration", () => {
  it("has the columns, uniqueness and ZIP-only checks", () => {
    for (const piece of [
      "user_id uuid not null",
      "zip text not null",
      "city text not null",
      "state text not null",
      "created_at timestamptz",
      "unique (user_id, zip)",
      "[0-9]{5}",
    ]) {
      expect(sql).toContain(piece);
    }
  });
  it("turns on RLS with own-row policies and narrow grants", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("revoke all on public.officials_lookups from anon, authenticated");
    expect(sql).toContain("grant insert (user_id, zip, city, state)");
    expect(sql).toContain("grant update (created_at)");
    expect(sql.match(/user_id = \(select auth\.uid\(\)\)/g)?.length).toBeGreaterThanOrEqual(5);
  });
});
