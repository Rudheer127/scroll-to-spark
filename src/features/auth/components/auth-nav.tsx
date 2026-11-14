"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const WELCOME_FROM = ["/login", "/signup"];
const WORDMARK =
  "bg-(image:--gradient-spark) bg-clip-text font-display text-5xl font-extrabold tracking-tight text-transparent";

/** The Spark logo. On log in and sign up it links back to the welcome page; elsewhere it is plain. */
export function AuthLogo() {
  const pathname = usePathname();
  if (!WELCOME_FROM.includes(pathname)) return <p className={WORDMARK}>Spark</p>;
  return (
    <Link
      href="/welcome"
      aria-label="Spark, back to the welcome page"
      className="w-fit active:opacity-75"
    >
      <span className={WORDMARK}>Spark</span>
    </Link>
  );
}

/** A back link to the welcome page, shown on log in and sign up only. */
export function AuthBackLink() {
  const pathname = usePathname();
  if (!WELCOME_FROM.includes(pathname)) return null;
  return (
    <Link
      href="/welcome"
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-(--radius-control) border border-border bg-surface px-4 text-sm font-semibold hover:bg-chip active:opacity-75"
    >
      <ArrowLeft aria-hidden className="size-4" />
      Back to home
    </Link>
  );
}
