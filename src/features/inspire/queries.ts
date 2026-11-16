import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { isEffort } from "@/features/steps/constants";
import { loose } from "@/features/threads/loose-db";
import {
  PAGE_SIZE,
  cursorFilter,
  decodeCursor,
  encodeCursor,
  toTsQuery,
  type FeedFilters,
} from "@/features/inspire/filters";
import type { FeedPage, InspirePost, Sharing } from "@/features/inspire/types";

export type FeedRow = {
  id: string;
  task_id: string;
  title: string;
  group_name: string;
  group_slug: string;
  group_color: string;
  effort: string;
  minutes: number;
  created_at: string;
  author_name: string;
  avatar_url: string | null;
  has_thank_you: boolean;
  thank_kind: string | null;
  thank_body: string | null;
  is_sample: boolean;
  inspired_count: number;
  inspired_by_me: boolean;
  saved_by_me: boolean;
  is_mine: boolean;
};

const COLUMNS =
  "id, task_id, title, group_name, group_slug, group_color, effort, minutes, created_at, author_name, avatar_url, has_thank_you, thank_kind, thank_body, is_sample, inspired_count, inspired_by_me, saved_by_me, is_mine";

export function toPost(row: FeedRow): InspirePost {
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    groupName: row.group_name,
    groupSlug: row.group_slug,
    groupColor: row.group_color,
    effort: isEffort(row.effort) ? row.effort : "tiny",
    minutes: row.minutes,
    createdAt: row.created_at,
    authorName: row.author_name,
    avatarUrl: row.avatar_url,
    hasThankYou: row.has_thank_you,
    thankKind: row.thank_kind === "written" || row.thank_kind === "tap" ? row.thank_kind : null,
    thankBody: row.thank_body,
    isSample: row.is_sample,
    inspiredCount: row.inspired_count,
    inspiredByMe: row.inspired_by_me,
    savedByMe: row.saved_by_me,
    isMine: row.is_mine,
  };
}

/**
 * One page of the feed. The database view returns only posts people chose to share, so nothing
 * private can come back no matter what the filters say. `cursor` continues after the last post
 * of the previous page.
 */
export async function getFeedPage(
  filters: FeedFilters,
  cursor: string | null = null,
): Promise<FeedPage> {
  const user = await getCurrentUser();
  if (!user) return { posts: [], nextCursor: null };

  const db = loose(await createClient());
  let query = db.from("inspiration_feed").select(COLUMNS);

  if (filters.tab === "saved") query = query.eq("saved_by_me", true);
  if (filters.effort) query = query.eq("effort", filters.effort);
  if (filters.group) query = query.eq("group_slug", filters.group);
  if (filters.minutes) query = query.lte("minutes", filters.minutes);
  if (filters.thanks) query = query.eq("has_thank_you", true);
  const tsquery = toTsQuery(filters.q);
  if (tsquery) query = query.textSearch("search_doc", tsquery, { config: "simple" });

  const decoded = decodeCursor(cursor);
  if (decoded) query = query.or(cursorFilter(decoded, filters.sort));

  if (filters.sort === "inspiring") query = query.order("inspired_count", { ascending: false });
  query = query.order("created_at", { ascending: false }).order("id", { ascending: false });

  const { data, error } = await query.limit(PAGE_SIZE + 1);
  if (error) throw new Error(`Could not load the feed: ${error.message}`);

  const rows = (data ?? []) as FeedRow[];
  const more = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE);
  const last = page.at(-1);
  return {
    posts: page.map(toPost),
    nextCursor:
      more && last
        ? encodeCursor({
            created: last.created_at,
            id: last.id,
            inspired: filters.sort === "inspiring" ? last.inspired_count : undefined,
          })
        : null,
  };
}

/** The groups that have shared posts, for the group filter. */
export async function getGroupOptions(): Promise<{ slug: string; name: string }[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const db = loose(await createClient());
  const { data } = await db.from("inspiration_feed").select("group_slug, group_name").limit(500);
  const seen = new Map<string, string>();
  for (const row of (data ?? []) as { group_slug: string; group_name: string }[]) {
    seen.set(row.group_slug, row.group_name);
  }
  return [...seen]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const SEARCH_LIMIT = 5;

/** The person's most recent Get Inspired searches, newest first. */
export async function getRecentSearches(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const db = loose(await createClient());
  const { data } = await db
    .from("search_history")
    .select("term")
    .eq("user_id", user.id)
    .eq("scope", "inspire")
    .order("created_at", { ascending: false })
    .limit(SEARCH_LIMIT);
  return ((data ?? []) as { term: string }[]).map((row) => row.term);
}

/** Whether each of your own completions is shared. Keyed by completion id. */
export async function getMySharing(): Promise<Record<string, Sharing>> {
  const user = await getCurrentUser();
  if (!user) return {};
  const db = loose(await createClient());
  const { data } = await db
    .from("task_completions")
    .select("id, share_publicly, share_thank_you")
    .eq("user_id", user.id);
  const result: Record<string, Sharing> = {};
  for (const row of (data ?? []) as {
    id: string;
    share_publicly: boolean;
    share_thank_you: boolean;
  }[]) {
    result[row.id] = { sharePublicly: row.share_publicly, shareThankYou: row.share_thank_you };
  }
  return result;
}
