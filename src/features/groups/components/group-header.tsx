import { Globe, Lock, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { DeleteGroupDialog } from "@/features/groups/components/delete-group-dialog";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { JoinLeaveButton } from "@/features/groups/components/join-leave-button";
import { swatchClass } from "@/features/groups/constants";
import type { GroupSummary } from "@/features/groups/types";

export function GroupHeader({ group }: { group: GroupSummary }) {
  const VisibilityIcon = group.isPrivate ? Lock : Globe;

  return (
    <header className="overflow-hidden rounded-(--radius-card) border border-border bg-surface">
      <div aria-hidden className={cn("h-28", swatchClass(group.color))} />
      <div className="flex flex-wrap items-center gap-5 px-6 py-5">
        <GroupAvatar name={group.name} color={group.color} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-3xl font-bold">{group.name}</h1>
          <p className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Users aria-hidden className="size-4" />
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </span>
            <span className="flex items-center gap-1.5">
              <VisibilityIcon aria-hidden className="size-4" />
              {group.isPrivate ? "Private group" : "Public group"}
            </span>
          </p>
        </div>
        {group.isOwner ? (
          <DeleteGroupDialog groupId={group.id} groupName={group.name} />
        ) : (
          <JoinLeaveButton groupId={group.id} isMember={group.isMember} />
        )}
      </div>
    </header>
  );
}
