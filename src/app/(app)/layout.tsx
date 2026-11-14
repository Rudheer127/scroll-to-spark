import { AppShell } from "@/components/layout/app-shell";
import { SparkGuide } from "@/features/guide/components/spark-guide";
import { LiveRefresh } from "@/components/shared/live-refresh";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell>
      <LiveRefresh />
      {children}
      <SparkGuide />
    </AppShell>
  );
}
