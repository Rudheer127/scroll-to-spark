"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Dialog } from "@/components/ui/dialog";
import { SampleBadge } from "@/components/shared/sample-badge";
import { EFFORT_LABELS } from "@/features/steps/constants";
import { ReportButton } from "@/features/threads/components/report-button";
import { formatMinutes, formatRelativeTime } from "@/lib/format-time";
import type { InspirePost } from "@/features/inspire/types";

type InspireDialogProps = {
  post: InspirePost | null;
  onClose: () => void;
  onInspired: (post: InspirePost) => void;
  onSaved: (post: InspirePost) => void;
};

/** The full story of one shared step, with a way to do the same step. */
export function InspireDialog({ post, onClose, onInspired, onSaved }: InspireDialogProps) {
  return (
    <Dialog
      open={post !== null}
      onClose={onClose}
      title={post?.title ?? "Shared step"}
      description={
        post ? `${post.authorName} did this ${formatRelativeTime(post.createdAt)}` : undefined
      }
    >
      {post ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {post.isSample ? <SampleBadge /> : null}
            <Link
              href={`/discussions/${post.groupSlug}`}
              className="font-semibold text-action hover:underline"
            >
              {post.groupName}
            </Link>
            <span className="rounded-full bg-chip px-2.5 py-0.5 font-semibold">
              {formatMinutes(post.minutes)}
            </span>
            <span className="rounded-full bg-chip px-2.5 py-0.5 font-semibold">
              {EFFORT_LABELS[post.effort].label}
            </span>
          </div>
          {post.hasThankYou ? (
            <p className="rounded-(--radius-input) bg-teal-soft p-3 text-sm text-ink">
              <span className="font-bold text-teal-ink">The group said:</span>{" "}
              {post.thankKind === "written" && post.thankBody ? post.thankBody : "Thank you."}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => onInspired(post)}
              aria-pressed={post.inspiredByMe}
            >
              <Heart aria-hidden className={post.inspiredByMe ? "size-4 fill-current" : "size-4"} />
              Inspired me · {post.inspiredCount}
            </Button>
            <Button variant="outline" onClick={() => onSaved(post)} aria-pressed={post.savedByMe}>
              {post.savedByMe ? (
                <BookmarkCheck aria-hidden className="size-4" />
              ) : (
                <Bookmark aria-hidden className="size-4" />
              )}
              {post.savedByMe ? "Unsave" : "Save for later"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {post.isMine || post.isSample ? (
              <span />
            ) : (
              <ReportButton targetType="inspiration" targetId={post.id} noun="post" />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <ButtonLink href={`/steps/${post.taskId}`} variant="brand">
                Do this step too
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
