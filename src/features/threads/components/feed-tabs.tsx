import Link from "next/link";
import { cn } from "@/lib/cn";
import type { FeedTab } from "@/features/threads/queries";

const TABS: { tab: FeedTab; label: string }[] = [
  { tab: "trending", label: "Trending" },
  { tab: "new", label: "New" },
  { tab: "following", label: "Following" },
];

/** Pills that switch the feed. The choice lives in the address as ?tab=. */
export function FeedTabs({ current }: { current: FeedTab }) {
  return (
    <nav aria-label="Feed order" className="flex flex-wrap gap-2">
      {TABS.map(({ tab, label }) => (
        <Link
          key={tab}
          href={tab === "trending" ? "/discussions" : `/discussions?tab=${tab}`}
          aria-current={tab === current ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold active:opacity-75 md:min-h-10",
            tab === current ? "bg-ink text-on-ink" : "bg-chip hover:bg-border",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
