import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20261114160000_guide_harness.sql"),
  "utf8",
);
const lower = sql.toLowerCase();
const tables = ["evidence_claims", "contributions", "guide_messages", "guide_events"];

describe("guide harness migration", () => {
  it.each(tables)("enables row level security on %s", (table) => {
    expect(lower).toContain(`alter table public.${table} enable row level security`);
  });

  it("indexes every foreign key column", () => {
    for (const table of ["contributions", "guide_messages", "guide_events"]) {
      expect(lower).toMatch(new RegExp(`create index \\w+ on public\\.${table} \\(user_id`));
    }
  });

  it("gives guide_events no policy and no grant for clients", () => {
    expect(lower).not.toMatch(/create policy[^;]*on public\.guide_events/);
    expect(lower).not.toMatch(/grant[^;]*on public\.guide_events to/);
    expect(lower).toMatch(/revoke all on public\.guide_events from anon, authenticated/);
  });

  it("limits the contributions insert grant and excludes verification", () => {
    const grant = lower.match(/grant insert \(([^)]*)\) on public\.contributions to authenticated/);
    expect(grant).not.toBeNull();
    const cols = (grant?.[1] ?? "").split(",").map((c) => c.trim());
    expect(cols).toEqual(["user_id", "title", "description", "minutes", "occurred_on"]);
    expect(lower).not.toMatch(/grant[^;]*update[^;]*on public\.contributions/);
  });

  it("keeps current_date out of check constraints and uses a trigger instead", () => {
    const checks = lower.match(/check\s*\([^;]*?\)(?=,|\n)/g) ?? [];
    for (const c of checks) expect(c).not.toContain("current_date");
    expect(lower).toContain("create function private.reject_future_contribution");
    expect(lower).toContain("before insert on public.contributions");
    expect(lower).toContain("current_date");
  });

  it("uses the select auth.uid() form in every policy", () => {
    expect(sql).not.toMatch(/(?<!select )auth\.uid\(\)/);
  });

  it("contains no em dash", () => {
    expect(sql).not.toContain(String.fromCharCode(0x2014));
    expect(sql).not.toContain(String.fromCharCode(0x2013));
  });

  it("seeds the census figures with verified_at null", () => {
    expect(sql).toContain("54%");
    expect(sql).toContain("28.3%");
    expect(lower).toMatch(/insert into public\.evidence_claims/);
    expect(lower).toMatch(/verified_at[^;]*null/);
    expect(sql).toContain("Link needs a re-check.");
  });

  it("lets clients insert only user-role guide messages with limited columns", () => {
    const policy = lower.match(/create policy "add own guide messages"[^;]*;/)?.[0] ?? "";
    expect(policy).toContain("role = 'user'");
    const grant = lower.match(
      /grant insert \(([^)]*)\) on public\.guide_messages to authenticated/,
    );
    expect(grant).not.toBeNull();
    const cols = (grant?.[1] ?? "").split(",").map((c) => c.trim());
    expect(cols).toEqual(["user_id", "role", "content"]);
    expect(lower).not.toMatch(/grant[^;]*\binsert\b(?! \()[^;]*on public\.guide_messages/);
  });

  it("locks down the future-date trigger function", () => {
    const fn =
      lower.match(/create function private\.reject_future_contribution[\s\S]*?\$\$;/)?.[0] ?? "";
    expect(fn).toContain("set search_path = ''");
    expect(lower).toMatch(
      /revoke execute on function private\.reject_future_contribution\(\) from public, anon, authenticated/,
    );
  });
});
