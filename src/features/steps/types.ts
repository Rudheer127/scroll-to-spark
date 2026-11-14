import type { Effort, Place } from "@/features/steps/constants";

export type TaskSummary = {
  id: string;
  title: string;
  description: string | null;
  minutes: number;
  effort: Effort;
  place: Place;
  replyWithinHours: number;
  groupId: string;
  groupName: string;
  groupSlug: string;
  groupColor: string;
  groupIsDemo: boolean;
};

export type ThankYouSummary = {
  kind: "tap" | "written";
  body: string | null;
  fromName: string;
  createdAt: string;
};

export type CompletionSummary = {
  id: string;
  taskId: string;
  taskTitle: string;
  minutes: number;
  groupName: string;
  groupSlug: string;
  groupColor: string;
  groupIsDemo: boolean;
  note: string | null;
  createdAt: string;
  thankYou: ThankYouSummary | null;
};

export type WaitingCompletion = {
  id: string;
  taskTitle: string;
  groupName: string;
  personName: string;
  note: string | null;
  createdAt: string;
};

export type OwnedTask = {
  id: string;
  title: string;
  minutes: number;
  effort: Effort;
  isOpen: boolean;
  groupName: string;
  completionCount: number;
};
