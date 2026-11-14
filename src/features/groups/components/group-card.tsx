import Link from "next/link";
import { Lock, Users } from "lucide-react";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { JoinLeaveButton } from "@/features/groups/components/join-leave-button";
import type { GroupSummary } from "@/features/groups/types";

export function GroupCard({ group }: { group: GroupSummary }) {
  return (
    <article className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-5">
      <div className="flex items-center gap-4">
        <GroupAvatar name={group.name} color={group.color} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link href={`/discussions/${group.slug}`} className="truncate text-lg font-bold">
            {group.name}
          </Link>
          <p className="flex items-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Users aria-hidden className="size-4" />
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </span>
            {group.isPrivate ? (
              <span className="flex items-center gap-1">
                <Lock aria-hidden className="size-4" />
                Private
              </span>
            ) : null}
          </p>
        </div>
      </div>
      {group.description ? <p className="line-clamp-2 text-sm">{group.description}</p> : null}
      <div className="mt-auto">
        {group.isOwner ? (
          <p className="text-sm text-muted">You own this group</p>
        ) : (
          <JoinLeaveButton groupId={group.id} isMember={group.isMember} />
        )}
      </div>
    </article>
  );
}
