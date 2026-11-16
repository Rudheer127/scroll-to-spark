import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20261116030000_inspiration_feed.sql"),
  "utf8",
).toLowerCase();

describe("inspiration feed migration", () => {
  it("shares nothing by default", () => {
    expect(sql).toContain("add column share_publicly boolean not null default false");
    expect(sql).toContain("add column share_thank_you boolean not null default false");
  });

  it("lets a client change only the two sharing switches, never sample or hidden flags", () => {
    const grant = sql.match(/grant update \(([^)]*)\) on public\.task_completions/);
    expect(grant?.[1]).toBe("share_publicly, share_thank_you");
  });

  it("keeps reactions and saves to the person's own rows", () => {
    for (const table of ["inspiration_reactions", "inspiration_saves"]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
    expect(sql.match(/user_id = \(select auth\.uid\(\)\)/g)?.length).toBeGreaterThanOrEqual(7);
  });

  it("builds the feed from shared, unhidden rows and exposes no email, username or note", () => {
    const view = sql.slice(sql.indexOf("create view public.inspiration_feed"));
    expect(view).toContain("where c.share_publicly");
    expect(view).toContain("not c.inspiration_hidden");
    expect(view).not.toMatch(/\bemail\b|username|c\.note/);
    expect(view).toContain("case when c.share_thank_you then ty.body end");
    expect(view).toContain("revoke all on public.inspiration_feed from anon, authenticated");
  });

  it("indexes search with GIN and hides after reports like discussions do", () => {
    expect(sql).toContain("using gin (search)");
    expect(sql).toContain("threshold constant int := 3");
    expect(sql).toContain("set inspiration_hidden = true");
  });
});
