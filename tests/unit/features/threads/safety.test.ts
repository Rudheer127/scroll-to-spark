import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detectPersonalInfo } from "@/features/threads/personal-info";
import { IMAGE_MAX_BYTES, isOwnImagePath, validateImageFile } from "@/features/threads/image-rules";
import { createThreadSchema, reportSchema } from "@/features/threads/schemas";
import { addCommentSchema } from "@/features/comments/schemas";
import { createGroupSchema } from "@/features/groups/schemas";
import { buildCommentTree } from "@/features/comments/tree";

const UUID = "2f1c1c52-6d7e-4a53-9a4f-2a8d0a4b9c11";
const lower = readFileSync(
  join(process.cwd(), "supabase/migrations/20261115010000_discussions_safety.sql"),
  "utf8",
).toLowerCase();

describe("personal info nudge", () => {
  it.each([
    ["call me 480-555-0199", ["phone number"]],
    ["(480) 555 0199 anytime", ["phone number"]],
    ["+1 480.555.0199", ["phone number"]],
    ["write to jo.smith+x@asu.edu", ["email address"]],
    ["jo@asu.edu or 4805550199", ["phone number", "email address"]],
  ])("flags %s", (text, kinds) => {
    expect(detectPersonalInfo(text)).toEqual(kinds);
  });

  it("leaves ordinary text and small numbers alone", () => {
    expect(detectPersonalInfo("We met 12 people on 3 Nov, 2026", null)).toEqual([]);
  });
});

describe("image rules", () => {
  it("accepts small jpeg, png and webp", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateImageFile({ type, size: 1000 })).toBeNull();
    }
  });
  it("rejects other types, empty files and files over 5 MB", () => {
    expect(validateImageFile({ type: "application/pdf", size: 10 })).toMatch(/JPEG/);
    expect(validateImageFile({ type: "image/png", size: IMAGE_MAX_BYTES + 1 })).toMatch(/5 MB/);
    expect(validateImageFile({ type: "image/png", size: 0 })).toMatch(/empty/);
  });
  it("only accepts paths inside the poster's own folder", () => {
    expect(isOwnImagePath(`${UUID}/${UUID}.png`, UUID)).toBe(true);
    expect(isOwnImagePath(`${UUID}/${UUID}.png`, "other")).toBe(false);
    expect(isOwnImagePath(`${UUID}/../x.png`, UUID)).toBe(false);
    expect(isOwnImagePath(`${UUID}/a.exe`, UUID)).toBe(false);
  });
});

describe("schemas", () => {
  it("requires alt text when a thread has an image", () => {
    const base = { groupId: UUID, title: "Hi", body: "", imagePath: "p.png", imageAlt: null };
    expect(createThreadSchema.safeParse(base).success).toBe(false);
    expect(createThreadSchema.safeParse({ ...base, imageAlt: "A flyer" }).success).toBe(true);
    expect(createThreadSchema.safeParse({ ...base, imagePath: null }).success).toBe(true);
  });
  it("lets a comment be an image alone but not empty", () => {
    const base = {
      threadId: UUID,
      parentId: null,
      body: "",
      imagePath: null,
      gifUrl: null,
      imageAlt: null,
    };
    expect(addCommentSchema.safeParse(base).success).toBe(false);
    expect(
      addCommentSchema.safeParse({ ...base, imagePath: "p.png", imageAlt: "A flyer" }).success,
    ).toBe(true);
    expect(addCommentSchema.safeParse({ ...base, imagePath: "p.png" }).success).toBe(false);
  });
  it("limits group rules to 1000 characters", () => {
    const base = { name: "Neighbors", description: "", isPrivate: false, color: "pink" };
    expect(createGroupSchema.safeParse({ ...base, rules: "x".repeat(1001) }).success).toBe(false);
    expect(createGroupSchema.parse({ ...base, rules: "  " }).rules).toBeNull();
  });
  it("validates reports", () => {
    const ok = { targetType: "thread", targetId: UUID, reason: "spam", details: "" };
    expect(reportSchema.safeParse(ok).success).toBe(true);
    expect(reportSchema.safeParse({ ...ok, targetType: "user" }).success).toBe(false);
  });
});

describe("comment tree keeps concealed comments in place", () => {
  it("keeps replies under a blocked comment", () => {
    const base = { authorId: "x", authorName: "x", reactions: [] };
    const tree = buildCommentTree(
      [
        { ...base, id: "a", parentId: null, body: null, createdAt: "1", blocked: true },
        { ...base, id: "b", parentId: "a", body: "hi", createdAt: "2" },
      ],
      "me",
    );
    expect(tree).toHaveLength(1);
    expect(tree[0].blocked).toBe(true);
    expect(tree[0].children[0].id).toBe("b");
  });
});

describe("discussions safety migration", () => {
  it("enables RLS on reports and user_blocks", () => {
    expect(lower).toContain("alter table public.reports enable row level security");
    expect(lower).toContain("alter table public.user_blocks enable row level security");
  });
  it("lets reporters insert and read only their own reports", () => {
    expect(lower).toMatch(
      /create policy "report what you can see" on public\.reports\s+for insert/,
    );
    expect(lower).toMatch(
      /create policy "read own reports" on public\.reports\s+for select[^;]*reporter_id = \(select auth\.uid\(\)\)/,
    );
    expect(lower).toContain("grant select, insert on public.reports to authenticated");
    expect(lower).not.toMatch(/grant[^;]*(update|delete)[^;]*on public\.reports/);
  });
  it("hides after three distinct reporters and guards the hidden column", () => {
    expect(lower).toContain("count(distinct reporter_id)");
    expect(lower).toContain("threshold constant int := 3");
    expect(lower).toContain("pg_trigger_depth() = 1");
  });
  it("rate limits threads, comments and groups", () => {
    for (const t of ["threads", "comments", "groups"]) {
      expect(lower).toContain(`create trigger limit_${t} before insert on public.${t}`);
    }
  });
  it("stops authors voting on their own thread", () => {
    expect(lower).toContain("not private.is_thread_author(thread_id)");
  });
});
