import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FeedExplorer } from "@/features/inspire/components/feed-explorer";
import { filtersToParams, parseFilters } from "@/features/inspire/filters";
import { getFeedPage, getGroupOptions, getRecentSearches } from "@/features/inspire/queries";

type SearchParamsProp = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = { title: "Get inspired" };

async function InspireContent({ searchParams }: SearchParamsProp) {
  const filters = parseFilters(await searchParams);
  const [page, groups, searches] = await Promise.all([
    getFeedPage(filters),
    getGroupOptions(),
    getRecentSearches(),
  ]);
  return (
    <FeedExplorer
      key={filtersToParams(filters).toString()}
      filters={filters}
      initialPage={page}
      groups={groups}
      initialSearches={searches}
    />
  );
}

function InspireSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading posts" className="flex animate-pulse flex-col gap-4">
      <div className="h-10 w-72 max-w-full rounded-full bg-chip" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-44 rounded-(--radius-card) bg-chip" />
        ))}
      </div>
    </div>
  );
}

export default function InspirePage({ searchParams }: SearchParamsProp) {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Get inspired" }]} />
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold">Get inspired</h1>
        <p className="text-lg text-muted">
          Small steps other people chose to share. Only a first name, a last initial and your
          profile photo show, and you decide what you share from My steps.
        </p>
      </header>
      <Suspense fallback={<InspireSkeleton />}>
        <InspireContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
