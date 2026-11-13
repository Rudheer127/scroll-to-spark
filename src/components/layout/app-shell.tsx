import { Sidebar } from "@/components/layout/sidebar";

/**
 * The signed-in frame: a fixed navigation rail and a main area that uses all remaining width.
 * Do not add a max width or center the content here.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[244px_minmax(0,1fr)]">
      <Sidebar />
      <main className="min-w-0 px-10 py-8">{children}</main>
    </div>
  );
}
