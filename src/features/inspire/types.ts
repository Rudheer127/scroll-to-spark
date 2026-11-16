import type { Effort } from "@/features/steps/constants";

/** One shared step as the feed shows it. Only a first name and last initial identify the person. */
export type InspirePost = {
  id: string;
  taskId: string;
  title: string;
  groupName: string;
  groupSlug: string;
  groupColor: string;
  effort: Effort;
  minutes: number;
  createdAt: string;
  authorName: string;
  avatarUrl: string | null;
  hasThankYou: boolean;
  thankKind: "tap" | "written" | null;
  thankBody: string | null;
  isSample: boolean;
  inspiredCount: number;
  inspiredByMe: boolean;
  savedByMe: boolean;
  isMine: boolean;
};

export type FeedPage = { posts: InspirePost[]; nextCursor: string | null };

export type Sharing = { sharePublicly: boolean; shareThankYou: boolean };
