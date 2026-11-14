import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { UserBlock } from "@/components/layout/user-block";
import { GuidePopup } from "@/features/guide/components/guide-popup";
import { PageSkeleton } from "@/components/shared/page-skeleton";

/**
 * The signed-in frame: a fixed navigation rail and a main area that uses all remaining width.
 * Do not add a max width or center the content here.
 * Anything that reads the session sits behind a Suspense boundary so the frame shows at once.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[244px_minmax(0,1fr)]">
      <Suspense fallback={<div aria-hidden className="border-r border-border bg-surface" />}>
        <Sidebar
          footer={
            <Suspense fallback={null}>
              <UserBlock />
            </Suspense>
          }
        />
      </Suspense>
      <main className="min-w-0 px-10 py-8">
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </main>
      <GuidePopup />
    </div>
  );
}
