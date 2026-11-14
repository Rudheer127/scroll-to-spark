import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

/** Collapses the sidebar to an icon rail, or pins it open again. */
export function SidebarToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const label = collapsed ? "Pin sidebar open" : "Collapse sidebar";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <IconButton label={label} title={label} onClick={onToggle} className="md:size-11">
      <Icon aria-hidden className="size-5" />
    </IconButton>
  );
}
