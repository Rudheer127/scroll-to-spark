import { cn } from "@/lib/cn";
import { getInitials } from "@/lib/initials";
import { swatchClass } from "@/features/groups/constants";

const SIZES = {
  md: "size-12 text-base",
  lg: "size-20 text-2xl",
} as const;

type GroupAvatarProps = { name: string; color: string; size?: keyof typeof SIZES };

/** The group's colored circle with its initials. */
export function GroupAvatar({ name, color, size = "md" }: GroupAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        swatchClass(color),
        SIZES[size],
      )}
    >
      {getInitials(name)}
    </span>
  );
}
