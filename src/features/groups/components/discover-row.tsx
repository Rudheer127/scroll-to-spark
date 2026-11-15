import Link from "next/link";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { JoinLeaveButton } from "@/features/groups/components/join-leave-button";
import type { GroupSummary } from "@/features/groups/types";

/** One line in the Discover list: avatar, name, member count and Join or Joined. */
export function DiscoverRow({ group }: { group: GroupSummary }) {
  return (
    <li className="flex items-center gap-3">
      <GroupAvatar name={group.name} color={group.color} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/discussions/${group.slug}`}
          className="text-sm font-bold [overflow-wrap:anywhere]"
        >
          {group.name}
        </Link>
        <p className="text-xs text-muted">
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
          {group.isMember ? " · You joined" : ""}
        </p>
      </div>
      {group.isOwner ? (
        <span className="text-xs font-bold text-muted">Yours</span>
      ) : (
        <JoinLeaveButton groupId={group.id} isMember={group.isMember} />
      )}
    </li>
  );
}
