import Link from "next/link";
import { GroupAvatar } from "@/features/groups/components/group-avatar";

/** A group as a round story: a sunset ring around its colored initials, with the name below. */
export function GroupStory({ name, slug, color }: { name: string; slug: string; color: string }) {
  return (
    <Link
      href={`/discussions/${slug}`}
      className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center active:opacity-75"
    >
      <span className="rounded-full bg-(image:--gradient-spark) p-[3px]">
        <span className="block rounded-full bg-surface p-[3px]">
          <GroupAvatar name={name} color={color} size="story" />
        </span>
      </span>
      <span className="line-clamp-2 w-full text-xs leading-tight font-semibold [overflow-wrap:anywhere]">
        {name}
      </span>
    </Link>
  );
}
