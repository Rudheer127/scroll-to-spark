import {
  Building2,
  Home,
  MessagesSquare,
  Sparkles,
  Sprout,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; short: string; icon: LucideIcon };

/** The main navigation, shared by the desktop sidebar and the phone tab bar. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", short: "Home", icon: Home },
  { href: "/steps", label: "My steps", short: "Steps", icon: Sprout },
  { href: "/discussions", label: "Discussions", short: "Groups", icon: MessagesSquare },
  { href: "/guide", label: "Guide", short: "Guide", icon: Sparkles },
  { href: "/portal", label: "Partner portal", short: "Portal", icon: Building2 },
  { href: "/profile", label: "Profile", short: "Profile", icon: User },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
