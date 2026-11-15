import { Lock, Users } from "lucide-react";
import { SampleBadge } from "@/components/shared/sample-badge";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { GroupOwnerMenu } from "@/features/groups/components/group-owner-menu";
import { ReportButton } from "@/features/threads/components/report-button";
import { JoinLeaveButton } from "@/features/groups/components/join-leave-button";
import type { GroupSummary } from "@/features/groups/types";

export function GroupHeader({ group }: { group: GroupSummary }) {
  return (
    <header className="flex flex-wrap items-center gap-5 rounded-(--radius-card) border border-border border-t-4 border-t-coral bg-surface px-6 py-5 shadow-card">
      <GroupAvatar name={group.name} color={group.color} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 text-3xl font-bold [overflow-wrap:anywhere]">{group.name}</h1>
          {group.isDemo ? <SampleBadge /> : null}
        </div>
        <p className="flex items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Users aria-hidden className="size-4" />
            {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
          </span>
          {group.isPrivate ? (
            <span className="flex items-center gap-1.5">
              <Lock aria-hidden className="size-4" />
              Private group
            </span>
          ) : null}
        </p>
      </div>
      {group.isOwner ? (
        <GroupOwnerMenu
          group={{
            id: group.id,
            name: group.name,
            description: group.description,
            rules: group.rules,
            color: group.color,
            isPrivate: group.isPrivate,
          }}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <ReportButton targetType="group" targetId={group.id} noun="group" />
          <JoinLeaveButton groupId={group.id} isMember={group.isMember} />
        </div>
      )}
    </header>
  );
}
