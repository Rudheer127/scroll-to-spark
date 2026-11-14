import { cn } from "@/lib/cn";
import { getInitials } from "@/lib/initials";
import { swatchClass } from "@/features/groups/constants";

const SIZES = {
  md: "size-12 text-base",
  lg: "size-20 text-2xl",
} as const;

type GroupAvatarProps = { name: string; color: string; size?: keyof typeof SIZES };

/** The group's colored circle with its initials, inside a story ring. */
export function GroupAvatar({ name, color, size = "md" }: GroupAvatarProps) {
  return (
    <span className="inline-flex rounded-full bg-linear-to-tr from-brand-orange via-brand-pink to-brand-indigo p-0.5">
      <span className="inline-flex rounded-full bg-surface p-0.5">
        <span
          aria-hidden
          className={cn(
            "inline-flex items-center justify-center rounded-full font-bold text-white",
            swatchClass(color),
            SIZES[size],
          )}
        >
          {getInitials(name)}
        </span>
      </span>
    </span>
  );
}
