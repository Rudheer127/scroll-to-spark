import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { getBlockedIds } from "@/features/threads/blocks";
import { signImagePaths } from "@/features/threads/images";
import { loose } from "@/features/threads/loose-db";
import type { ThreadSummary } from "@/features/threads/types";

type ThreadRow = {
  id: string;
  group_id: string;
  author_id: string;
  title: string;
  body: string | null;
  created_at: string;
  profiles: { username: string };
  groups: { name: string; slug: string; color: string };
  thread_votes: { value: number; user_id: string }[];
  comments: { count: number }[];
  image_path: string | null;
  image_alt: string | null;
  hidden: boolean;
};

const THREAD_COLUMNS =
  "id, group_id, author_id, title, body, created_at, profiles!threads_author_id_fkey(username), groups(name, slug, color), thread_votes(value, user_id), comments(count), image_path, image_alt, hidden";

function toThread(row: ThreadRow, userId: string, imageUrls: Map<string, string>): ThreadSummary {
  const mine = row.thread_votes.find((vote) => vote.user_id === userId)?.value ?? 0;
  return {
    id: row.id,
    groupId: row.group_id,
    groupName: row.groups.name,
    groupSlug: row.groups.slug,
    groupColor: row.groups.color,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    authorId: row.author_id,
    authorName: row.profiles.username,
    voteScore: row.thread_votes.reduce((sum, vote) => sum + vote.value, 0),
    myVote: mine === 1 ? 1 : mine === -1 ? -1 : 0,
    commentCount: row.comments[0]?.count ?? 0,
    imageUrl: row.image_path ? (imageUrls.get(row.image_path) ?? null) : null,
    imageAlt: row.image_alt,
    hidden: row.hidden,
  };
}

/** Reported-away threads show only to their author. Threads by people you blocked never show. */
async function shape(supabase: unknown, rows: ThreadRow[], userId: string) {
  const blocked = await getBlockedIds(userId);
  const visible = rows.filter(
    (row) => !blocked.has(row.author_id) && (!row.hidden || row.author_id === userId),
  );
  const imageUrls = await signImagePaths(
    supabase,
    visible.map((row) => row.image_path),
  );
  return visible.map((row) => toThread(row, userId, imageUrls));
}

/** Threads in a group, highest score first, then newest. */
export async function getThreads(groupId: string): Promise<ThreadSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await loose(supabase)
    .from("threads")
    .select(THREAD_COLUMNS)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load threads: ${error.message}`);

  return (await shape(supabase, data as unknown as ThreadRow[], user.id)).sort(
    (a, b) => b.voteScore - a.voteScore || b.createdAt.localeCompare(a.createdAt),
  );
}

/** One thread, or null if it does not exist or you cannot see it. */
export async function getThread(threadId: string): Promise<ThreadSummary | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await loose(supabase)
    .from("threads")
    .select(THREAD_COLUMNS)
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the thread: ${error.message}`);
  if (!data) return null;
  const [thread] = await shape(supabase, [data as unknown as ThreadRow], user.id);
  return thread ?? null;
}

export type FeedTab = "trending" | "new" | "following";

export function isFeedTab(value: unknown): value is FeedTab {
  return value === "trending" || value === "new" || value === "following";
}

/** Threads from every group you can see. Following keeps only the groups you joined. */
export async function getFeed(tab: FeedTab, joinedGroupIds: Set<string>): Promise<ThreadSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await loose(supabase)
    .from("threads")
    .select(THREAD_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load threads: ${error.message}`);

  const threads = await shape(supabase, data as unknown as ThreadRow[], user.id);
  const shown =
    tab === "following" ? threads.filter((t) => joinedGroupIds.has(t.groupId)) : threads;
  return tab === "trending"
    ? shown.sort((a, b) => b.voteScore - a.voteScore || b.createdAt.localeCompare(a.createdAt))
    : shown;
}
