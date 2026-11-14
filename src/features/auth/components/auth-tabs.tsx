import Link from "next/link";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/login", label: "Log in", key: "login" },
  { href: "/signup", label: "Sign up", key: "signup" },
] as const;

/** A two-way switch between the log in and sign up screens, so it is clear which one you are on. */
export function AuthTabs({ active }: { active: "login" | "signup" }) {
  return (
    <nav
      aria-label="Log in or sign up"
      className="grid max-w-md grid-cols-2 gap-1 rounded-full bg-chip p-1"
    >
      {TABS.map(({ href, label, key }) => (
        <Link
          key={key}
          href={href}
          replace
          aria-current={key === active ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center justify-center rounded-full text-sm font-extrabold transition-colors active:opacity-75 md:min-h-10",
            key === active ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
