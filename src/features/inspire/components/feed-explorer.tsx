"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, Pause, Play, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { SearchHistory } from "@/components/shared/search-history";
import { cn } from "@/lib/cn";
import { EFFORTS, EFFORT_LABELS } from "@/features/steps/constants";
import {
  forgetSearches,
  loadMorePosts,
  rememberSearch,
  setInspired,
  setSaved,
} from "@/features/inspire/actions";
import {
  MINUTES_OPTIONS,
  SORTS,
  SORT_LABELS,
  filtersToParams,
  hasActiveFilters,
  type FeedFilters,
  type InspireSort,
} from "@/features/inspire/filters";
import { InspireCard } from "@/features/inspire/components/inspire-card";
import { InspireDialog } from "@/features/inspire/components/inspire-dialog";
import type { FeedPage, InspirePost } from "@/features/inspire/types";

type FeedExplorerProps = {
  filters: FeedFilters;
  initialPage: FeedPage;
  groups: { slug: string; name: string }[];
  initialSearches: string[];
};

function patch(posts: InspirePost[], id: string, change: Partial<InspirePost>) {
  return posts.map((post) => (post.id === id ? { ...post, ...change } : post));
}

/**
 * The feed with its search, filters, tabs and live updates. The server renders the first page for
 * the filters in the URL and refreshes it every few seconds. New posts wait behind a pill so the
 * list never moves under the reader; "Pause live updates" stops even that.
 */
export function FeedExplorer({ filters, initialPage, groups, initialSearches }: FeedExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [navigating, startNavigation] = useTransition();
  const [loadingMore, startLoadMore] = useTransition();

  const [posts, setPosts] = useState(initialPage.posts);
  const [cursor, setCursor] = useState(initialPage.nextCursor);
  const [pending, setPending] = useState<InspirePost[]>([]);
  const [paused, setPaused] = useState(false);
  const [seenPage, setSeenPage] = useState(initialPage);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searches, setSearches] = useState(initialSearches);
  const [query, setQuery] = useState(filters.q);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // A fresh page arrived from the periodic refresh. Keep the reader's list steady unless paused.
  if (initialPage !== seenPage) {
    setSeenPage(initialPage);
    if (!paused) {
      const shownIds = new Set(posts.map((post) => post.id));
      const fresh = new Map(initialPage.posts.map((post) => [post.id, post]));
      const canQueue = filters.sort === "newest" && filters.tab === "all";
      // A post that is gone (unshared, hidden after reports) must leave the list too. The refresh
      // only holds the newest page, so only posts it should have covered are dropped.
      const oldestFresh = initialPage.posts.at(-1)?.createdAt ?? null;
      const covered = (post: InspirePost) =>
        initialPage.nextCursor === null ||
        (filters.sort === "newest" && oldestFresh !== null && post.createdAt >= oldestFresh);
      setPosts(
        posts
          .filter((post) => fresh.has(post.id) || !covered(post))
          .map((post) => {
            const latest = fresh.get(post.id);
            return latest ? { ...post, inspiredCount: latest.inspiredCount } : post;
          }),
      );
      setPending(canQueue ? initialPage.posts.filter((post) => !shownIds.has(post.id)) : []);
    }
  }

  const open = posts.find((post) => post.id === openId) ?? null;
  const active = hasActiveFilters(filters);

  function go(next: FeedFilters) {
    const params = filtersToParams(next).toString();
    startNavigation(() =>
      router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false }),
    );
  }

  function search(term: string) {
    const clean = term.trim().replace(/\s+/g, " ");
    setQuery(clean);
    go({ ...filters, q: clean });
    if (clean.length >= 2) {
      void rememberSearch(clean).then((result) => {
        if (result.ok) setSearches(result.data.terms);
      });
    }
  }

  function clearFilters() {
    setQuery("");
    go({
      ...filters,
      q: "",
      effort: null,
      group: null,
      minutes: null,
      thanks: false,
      sort: "newest",
    });
  }

  function showPending() {
    setPosts((current) => {
      const ids = new Set(current.map((post) => post.id));
      return [...pending.filter((post) => !ids.has(post.id)), ...current];
    });
    setPending([]);
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function toggle(
    post: InspirePost,
    field: "inspiredByMe" | "savedByMe",
    action: typeof setInspired,
  ) {
    const on = !post[field];
    const change: Partial<InspirePost> =
      field === "inspiredByMe"
        ? { inspiredByMe: on, inspiredCount: Math.max(0, post.inspiredCount + (on ? 1 : -1)) }
        : { savedByMe: on };
    setError(null);
    setPosts((current) => patch(current, post.id, change));
    void action({ completionId: post.id, on }).then((result) => {
      if (!result.ok) {
        setPosts((current) =>
          patch(current, post.id, { [field]: !on, inspiredCount: post.inspiredCount }),
        );
        setError(result.error);
      } else if (field === "savedByMe" && !on && filters.tab === "saved") {
        // Unsaved from the Saved tab: it leaves the list.
        setPosts((current) => current.filter((item) => item.id !== post.id));
        setOpenId(null);
      }
    });
  }

  function loadMore() {
    if (!cursor) return;
    startLoadMore(async () => {
      const result = await loadMorePosts({ filters, cursor });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPosts((current) => {
        const ids = new Set(current.map((post) => post.id));
        return [...current, ...result.data.posts.filter((post) => !ids.has(post.id))];
      });
      setCursor(result.data.nextCursor);
    });
  }

  return (
    <div className="flex flex-col gap-5" ref={topRef}>
      <div role="tablist" aria-label="Feed" className="flex gap-2">
        {(["all", "saved"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={filters.tab === tab}
            onClick={() => go({ ...filters, tab })}
            className={cn(
              "min-h-11 rounded-full px-5 text-sm font-semibold md:min-h-10",
              filters.tab === tab ? "bg-ink text-on-ink" : "bg-chip hover:opacity-80",
            )}
          >
            {tab === "all" ? "All posts" : "Saved for later"}
          </button>
        ))}
      </div>

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          search(query);
        }}
        className="flex gap-2"
      >
        <label htmlFor="inspire-search" className="sr-only">
          Search shared steps
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id="inspire-search"
            type="search"
            value={query}
            maxLength={80}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search steps, groups or thank-yous"
            className={cn(inputClass, "w-full pl-9")}
          />
        </div>
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>

      <SearchHistory
        items={searches}
        onPick={search}
        onRemove={(term) => {
          setSearches((current) => current.filter((item) => item !== term));
          void forgetSearches(term);
        }}
        onClear={() => {
          setSearches([]);
          void forgetSearches();
        }}
      />

      <div className="flex flex-wrap items-end gap-3" aria-label="Filters" role="group">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Effort size">
          {EFFORTS.map((effort) => (
            <button
              key={effort}
              type="button"
              aria-pressed={filters.effort === effort}
              onClick={() => go({ ...filters, effort: filters.effort === effort ? null : effort })}
              className={cn(
                "min-h-10 rounded-full px-4 text-sm font-semibold",
                filters.effort === effort ? "bg-ink text-on-ink" : "bg-chip hover:opacity-80",
              )}
            >
              {EFFORT_LABELS[effort].label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Group
          <select
            value={filters.group ?? ""}
            onChange={(event) => go({ ...filters, group: event.target.value || null })}
            className={cn(inputClass, "min-h-10 py-1 text-sm text-ink")}
          >
            <option value="">All groups</option>
            {groups.map((group) => (
              <option key={group.slug} value={group.slug}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Time given
          <select
            value={filters.minutes ?? ""}
            onChange={(event) =>
              go({ ...filters, minutes: event.target.value ? Number(event.target.value) : null })
            }
            className={cn(inputClass, "min-h-10 py-1 text-sm text-ink")}
          >
            <option value="">Any time</option>
            {MINUTES_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                Up to {minutes} min
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Sort by
          <select
            value={filters.sort}
            onChange={(event) => go({ ...filters, sort: event.target.value as InspireSort })}
            className={cn(inputClass, "min-h-10 py-1 text-sm text-ink")}
          >
            {SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={filters.thanks}
            onChange={(event) => go({ ...filters, thanks: event.target.checked })}
            className="size-4"
          />
          Has a thank-you
        </label>
        {active ? (
          <Button variant="ghost" onClick={clearFilters}>
            <X aria-hidden className="size-4" />
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setPaused((value) => !value);
            if (paused) router.refresh();
          }}
          aria-pressed={paused}
        >
          {paused ? (
            <Play aria-hidden className="size-4" />
          ) : (
            <Pause aria-hidden className="size-4" />
          )}
          {paused ? "Resume live updates" : "Pause live updates"}
        </Button>
        <p role="status" className="text-sm text-muted">
          {paused ? "Live updates are paused." : "Checking for new posts every few seconds."}
        </p>
        {pending.length > 0 ? (
          <Button variant="brand" onClick={showPending} className="ml-auto">
            <ArrowUp aria-hidden className="size-4" />
            {pending.length} new {pending.length === 1 ? "post" : "posts"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div aria-busy={navigating} className={cn(navigating && "opacity-60 transition-opacity")}>
        {posts.length === 0 ? (
          <p className="rounded-(--radius-card) border border-border bg-surface p-6 text-muted shadow-card">
            {filters.tab === "saved" && !active
              ? "Nothing saved yet. Tap Save on a post to keep it here."
              : active
                ? "No shared steps match those filters."
                : "Nobody has shared a step yet. Share one of yours from My steps."}{" "}
            {active ? (
              <button
                type="button"
                onClick={clearFilters}
                className="font-semibold text-action hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <InspireCard
                key={post.id}
                post={post}
                onOpen={() => setOpenId(post.id)}
                onInspired={() => toggle(post, "inspiredByMe", setInspired)}
                onSaved={() => toggle(post, "savedByMe", setSaved)}
              />
            ))}
          </ul>
        )}
      </div>

      {cursor ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading" : "Show more"}
          </Button>
        </div>
      ) : null}

      <InspireDialog
        post={open}
        onClose={() => setOpenId(null)}
        onInspired={(post) => toggle(post, "inspiredByMe", setInspired)}
        onSaved={(post) => toggle(post, "savedByMe", setSaved)}
      />
    </div>
  );
}
