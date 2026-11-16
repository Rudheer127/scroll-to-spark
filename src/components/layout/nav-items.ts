import {
  Building2,
  CalendarDays,
  Home,
  Landmark,
  Lightbulb,
  LineChart,
  MessagesSquare,
  Settings,
  Sparkles,
  Sprout,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  /** The one name used by the sidebar and the phone tab bar. */
  label: string;
  icon: LucideIcon;
  /** False keeps it out of the phone tab bar, where room is tight (it stays in the account menu). */
  tabBar?: boolean;
};

/** The main navigation, shared by the desktop sidebar and the phone tab bar. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/steps", label: "My steps", icon: Sprout },
  { href: "/discussions", label: "Discussions", icon: MessagesSquare },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/inspire", label: "Inspire", icon: Lightbulb, tabBar: false },
  { href: "/officials", label: "Officials", icon: Landmark, tabBar: false },
  { href: "/impact", label: "Impact", icon: LineChart, tabBar: false },
  { href: "/guide", label: "Guide", icon: Sparkles },
  { href: "/portal", label: "Portal", icon: Building2 },
  // On phones Settings lives in the account menu in the header, so the bar stays five wide. Inspire and Officials are sidebar-only for the same reason.
  { href: "/settings", label: "Settings", icon: Settings, tabBar: false },
];

/** The items the phone tab bar shows. */
export const TAB_BAR_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => item.tabBar !== false);

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
