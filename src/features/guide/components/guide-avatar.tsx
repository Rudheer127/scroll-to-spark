import Image from "next/image";
import { cn } from "@/lib/cn";

const SIZE = { width: 48, height: 69 } as const;

/**
 * The guide's face: a cartoon eagle that drifts gently next to each answer. It stands in for a text label,
 * so it carries the accessible name that says the answer is from an AI. It is a mascot, never a person.
 * `busy` makes it bob faster while the guide is working. Motion stops for people who ask for less.
 */
export function GuideAvatar({ busy = false }: { busy?: boolean }) {
  return (
    <span
      role="img"
      aria-label="Spark Guide, an AI assistant"
      className={cn(
        "mt-0.5 inline-block shrink-0 select-none motion-safe:animate-float",
        busy && "motion-safe:animate-float-fast",
      )}
    >
      <Image
        src="/images/spark-guide-mascot.png"
        alt=""
        width={SIZE.width}
        height={SIZE.height}
        priority={false}
        draggable={false}
        className="h-auto w-12 drop-shadow-sm"
      />
    </span>
  );
}
