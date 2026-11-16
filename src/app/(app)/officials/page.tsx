import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { OfficialsExplorer } from "@/features/officials/components/officials-explorer";
import { getRecentLookups } from "@/features/officials/queries";

export const metadata: Metadata = { title: "Your officials" };

async function OfficialsContent() {
  return <OfficialsExplorer initialRecent={await getRecentLookups()} />;
}

export default function OfficialsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Your officials" }]} />
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold">Your officials</h1>
        <p className="text-lg text-muted">
          See the people who represent you, how to reach them, and where their campaign money comes
          from. Nonpartisan facts from public records.
        </p>
      </header>
      <Suspense fallback={<PageSkeleton />}>
        <OfficialsContent />
      </Suspense>
    </div>
  );
}
