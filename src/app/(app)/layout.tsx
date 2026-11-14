import { AppShell } from "@/components/layout/app-shell";
import { LiveRefresh } from "@/components/shared/live-refresh";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell>
      <LiveRefresh />
      {children}
    </AppShell>
  );
}
