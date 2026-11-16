"use client";

import { Bookmark, BookmarkCheck, Clock, Heart, MessageCircleHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/shared/sample-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { EFFORT_LABELS } from "@/features/steps/constants";
import { formatMinutes, formatRelativeTime } from "@/lib/format-time";
import type { InspirePost } from "@/features/inspire/types";

type InspireCardProps = {
  post: InspirePost;
  onOpen: () => void;
  onInspired: () => void;
  onSaved: () => void;
};

/** One shared step. The title opens the full story. */
export function InspireCard({ post, onOpen, onInspired, onSaved }: InspireCardProps) {
  return (
    <li className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center gap-3">
        <UserAvatar name={post.authorName} url={post.avatarUrl} />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">{post.authorName}</span>{" "}
          <span className="text-muted">did a step {formatRelativeTime(post.createdAt)}</span>
        </p>
        {post.isSample ? <SampleBadge /> : null}
      </div>
      <h2 className="text-lg font-bold">
        <button type="button" onClick={onOpen} className="text-left hover:underline">
          {post.title}
        </button>
      </h2>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <GroupAvatar name={post.groupName} color={post.groupColor} size="sm" />
        <span className="font-semibold text-ink">{post.groupName}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-0.5 font-semibold">
          <Clock aria-hidden className="size-3.5" />
          {formatMinutes(post.minutes)}
        </span>
        <span className="rounded-full bg-chip px-2.5 py-0.5 font-semibold">
          {EFFORT_LABELS[post.effort].label}
        </span>
      </div>
      {post.hasThankYou ? (
        <p className="flex items-start gap-2 rounded-(--radius-input) bg-teal-soft p-3 text-sm text-ink">
          <MessageCircleHeart aria-hidden className="mt-0.5 size-4 shrink-0 text-teal-ink" />
          <span>
            <span className="font-bold text-teal-ink">The group said:</span>{" "}
            {post.thankKind === "written" && post.thankBody ? post.thankBody : "Thank you."}
          </span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={onInspired}
          aria-pressed={post.inspiredByMe}
          className="px-3"
        >
          <Heart
            aria-hidden
            className={post.inspiredByMe ? "size-4 fill-current text-cta" : "size-4"}
          />
          Inspired me
          <span className="font-bold">{post.inspiredCount}</span>
        </Button>
        <Button variant="ghost" onClick={onSaved} aria-pressed={post.savedByMe} className="px-3">
          {post.savedByMe ? (
            <BookmarkCheck aria-hidden className="size-4" />
          ) : (
            <Bookmark aria-hidden className="size-4" />
          )}
          {post.savedByMe ? "Unsave" : "Save"}
          <span className="sr-only"> {post.title}</span>
        </Button>
        <Button variant="ghost" onClick={onOpen} className="ml-auto px-3">
          Read more
          <span className="sr-only"> about {post.title}</span>
        </Button>
      </div>
    </li>
  );
}
