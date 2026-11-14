import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
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
};

const THREAD_COLUMNS =
  "id, group_id, author_id, title, body, created_at, profiles!threads_author_id_fkey(username), groups(name, slug, color), thread_votes(value, user_id), comments(count)";

function toThread(row: ThreadRow, userId: string): ThreadSummary {
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
  };
}

/** Threads in a group, highest score first, then newest. */
export async function getThreads(groupId: string): Promise<ThreadSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("threads")
    .select(THREAD_COLUMNS)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load threads: ${error.message}`);

  return (data as unknown as ThreadRow[])
    .map((row) => toThread(row, user.id))
    .sort((a, b) => b.voteScore - a.voteScore || b.createdAt.localeCompare(a.createdAt));
}

/** One thread, or null if it does not exist or you cannot see it. */
export async function getThread(threadId: string): Promise<ThreadSummary | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("threads")
    .select(THREAD_COLUMNS)
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the thread: ${error.message}`);
  return data ? toThread(data as unknown as ThreadRow, user.id) : null;
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
  const { data, error } = await supabase
    .from("threads")
    .select(THREAD_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load threads: ${error.message}`);

  const threads = (data as unknown as ThreadRow[]).map((row) => toThread(row, user.id));
  const shown =
    tab === "following" ? threads.filter((t) => joinedGroupIds.has(t.groupId)) : threads;
  return tab === "trending"
    ? shown.sort((a, b) => b.voteScore - a.voteScore || b.createdAt.localeCompare(a.createdAt))
    : shown;
}
