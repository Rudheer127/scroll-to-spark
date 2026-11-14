import { Suspense } from "react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { UserBlock } from "@/components/layout/user-block";
import { GuidePopup } from "@/features/guide/components/guide-popup";
import { GuideProvider } from "@/features/guide/components/guide-provider";
import { isImageInputEnabled } from "@/features/guide/vision/image-input-enabled";
import { PageSkeleton } from "@/components/shared/page-skeleton";

/**
 * The signed-in frame: a fixed navigation rail and a main area that uses all remaining width.
 * Do not add a max width or center the content here.
 * Anything that reads the session sits behind a Suspense boundary so the frame shows at once.
 * The guide provider wraps everything, so the popup, its maximised window and the /guide page
 * share one conversation.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <GuideProvider imageInputEnabled={isImageInputEnabled()}>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[15.25rem_minmax(0,1fr)]">
        <Suspense
          fallback={
            <div aria-hidden className="hidden border-r border-border bg-surface lg:block" />
          }
        >
          <Sidebar
            footer={
              <Suspense fallback={null}>
                <UserBlock />
              </Suspense>
            }
          />
        </Suspense>
        <div className="flex min-w-0 flex-col lg:col-start-2 lg:row-start-1">
          <Suspense fallback={null}>
            <MobileHeader />
          </Suspense>
          <main className="min-w-0 px-(--page-gutter) py-[var(--page-gutter)] pb-24 lg:pb-8">
            <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
          </main>
        </div>
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
        <Suspense fallback={null}>
          <GuidePopup />
        </Suspense>
      </div>
    </GuideProvider>
  );
}
