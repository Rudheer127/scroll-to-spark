import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DIR = join(process.cwd(), "supabase/migrations");
const FILE = "20261114180000_guide_conversations.sql";
const sql = readFileSync(join(DIR, FILE), "utf8");
const lower = sql.toLowerCase();

const columns = (pattern: RegExp): string[] =>
  (lower.match(pattern)?.[1] ?? "").split(",").map((c) => c.trim());

describe("guide conversations migration", () => {
  it("has a version prefix no other migration uses", () => {
    const prefixes = readdirSync(DIR).map((f) => f.slice(0, 14));
    expect(prefixes.filter((p) => p === FILE.slice(0, 14))).toHaveLength(1);
  });

  it("turns on row level security for the new table", () => {
    expect(lower).toContain("alter table public.guide_conversations enable row level security");
    expect(lower).toContain("revoke all on public.guide_conversations from anon, authenticated");
  });

  it("grants select, delete and only (user_id, title) on insert, never update", () => {
    expect(lower).toContain("grant select, delete on public.guide_conversations to authenticated");
    expect(
      columns(/grant insert \(([^)]*)\) on public\.guide_conversations to authenticated/),
    ).toEqual(["user_id", "title"]);
    expect(lower).not.toMatch(/^grant[^;]*\bupdate\b[^;]*on public\.guide_conversations/m);
  });

  it("indexes the owner list and the messages of a chat", () => {
    expect(lower).toMatch(/on public\.guide_conversations \(user_id, updated_at desc\)/);
    expect(lower).toMatch(/on public\.guide_messages \(conversation_id, created_at\)/);
  });

  it("cascades a deleted conversation to its messages", () => {
    expect(lower).toMatch(
      /add column conversation_id uuid references public\.guide_conversations \(id\) on delete cascade/,
    );
  });

  it("extends the message insert grant with conversation_id only", () => {
    expect(columns(/grant insert \(([^)]*)\) on public\.guide_messages to authenticated/)).toEqual([
      "user_id",
      "role",
      "content",
      "conversation_id",
    ]);
  });

  it("checks the conversation belongs to the caller in the message insert policy", () => {
    const policy = lower.match(/create policy "add own guide messages"[^;]*;/)?.[0] ?? "";
    expect(policy).toContain("role = 'user'");
    expect(policy).toContain("conversation_id is null");
    expect(policy).toMatch(/c\.id = conversation_id and c\.user_id = \(select auth\.uid\(\)\)/);
    expect(lower).toContain('drop policy "add own guide messages" on public.guide_messages');
  });

  it("uses the select auth.uid() form in every policy", () => {
    expect(sql).not.toMatch(/(?<!select )auth\.uid\(\)/);
  });

  it("contains no em dash", () => {
    expect(sql).not.toContain(String.fromCharCode(0x2014));
    expect(sql).not.toContain(String.fromCharCode(0x2013));
  });
});
