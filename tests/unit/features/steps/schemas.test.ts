import { describe, expect, it } from "vitest";
import { completeTaskSchema, createTaskSchema } from "@/features/steps/schemas";
import { summarizeProgress } from "@/features/steps/progress";
import type { CompletionSummary } from "@/features/steps/types";

const ID = "11111111-1111-4111-8111-111111111111";

describe("completeTaskSchema", () => {
  it("needs a note", () => {
    expect(completeTaskSchema.safeParse({ taskId: ID, note: "   " }).success).toBe(false);
    expect(completeTaskSchema.safeParse({ taskId: ID, note: "Thanks!" }).success).toBe(true);
  });
});

describe("createTaskSchema", () => {
  const valid = {
    groupId: ID,
    title: "Write a note",
    description: "",
    minutes: "5",
    effort: "tiny",
    place: "home",
  };

  it("accepts a valid task and turns minutes into a number", () => {
    const result = createTaskSchema.safeParse(valid);
    expect(result.success && result.data.minutes).toBe(5);
  });

  it("rejects zero minutes and an unknown effort", () => {
    expect(createTaskSchema.safeParse({ ...valid, minutes: "0" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...valid, effort: "huge" }).success).toBe(false);
  });
});

describe("summarizeProgress", () => {
  const base: Omit<CompletionSummary, "id" | "createdAt" | "thankYou"> = {
    taskId: "t",
    taskTitle: "A task",
    groupName: "A group",
    groupSlug: "a-group",
    groupColor: "pink",
    groupIsDemo: false,
    note: null,
  };
  const now = new Date("2026-11-14T12:00:00Z").getTime();

  it("counts this week, all time and replies", () => {
    const items: CompletionSummary[] = [
      { ...base, id: "1", createdAt: "2026-11-13T12:00:00Z", thankYou: null },
      {
        ...base,
        id: "2",
        createdAt: "2026-10-01T12:00:00Z",
        thankYou: {
          kind: "tap",
          body: null,
          fromName: "A group",
          createdAt: "2026-10-02T12:00:00Z",
        },
      },
    ];
    expect(summarizeProgress(items, now)).toEqual({ thisWeek: 1, total: 2, replies: 1 });
  });
});
