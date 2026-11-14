import Image from "next/image";
import { cn } from "@/lib/cn";

type UserAvatarProps = { name: string; url?: string | null; className?: string };

/** A person's photo, or their initial on the sunset gradient when they have not added one. Size it with className. */
export function UserAvatar({ name, url, className }: UserAvatarProps) {
  const size = cn("size-9 shrink-0 rounded-full", className);
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={128}
        height={128}
        unoptimized
        className={cn(size, "bg-chip object-cover")}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        size,
        "inline-flex items-center justify-center bg-(image:--gradient-spark) font-bold text-white",
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
