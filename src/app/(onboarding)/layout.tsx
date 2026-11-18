import { Suspense } from "react";

export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading your setup...</p>}>{children}</Suspense>
    </main>
  );
}
