import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20261116040000_lock_completions_and_names.sql"),
  "utf8",
).toLowerCase();

describe("completions lock and name masking migration", () => {
  it("resets table-wide grants before regranting only what the app needs", () => {
    expect(sql).toContain("revoke all on public.task_completions from anon, authenticated");
    expect(sql).toContain("grant select on public.task_completions to authenticated");
    expect(sql.match(/grant insert \(([^)]*)\) on public\.task_completions/)?.[1]).toBe(
      "task_id, user_id, note",
    );
    expect(sql.match(/grant update \(([^)]*)\) on public\.task_completions/)?.[1]).toBe(
      "share_publicly, share_thank_you",
    );
  });

  it("shows a name only when its first word is a plain name, otherwise 'A neighbor'", () => {
    expect(sql).toContain("a neighbor");
    expect(sql).toContain("[[:alpha:]");
  });
});
