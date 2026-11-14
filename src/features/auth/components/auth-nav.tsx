"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

const WELCOME_FROM = ["/login", "/signup"];

/**
 * The top bar of the sign-in screens: the Spark logo, and on log in and sign up a round back
 * button. Both lead to the welcome page. On the other sign-in screens the logo is plain.
 * `onPhoto` is for the dark photo panel, where the controls are white.
 */
export function AuthTopBar({ onPhoto = false }: { onPhoto?: boolean }) {
  const pathname = usePathname();
  const canGoBack = WELCOME_FROM.includes(pathname);

  const wordmark = (
    <span
      className={cn(
        "font-display text-3xl font-extrabold tracking-tight",
        onPhoto ? "text-white" : "bg-(image:--gradient-spark) bg-clip-text text-transparent",
      )}
    >
      Spark
    </span>
  );

  return (
    <div className="flex items-center gap-3">
      {canGoBack ? (
        <Link
          href="/welcome"
          aria-label="Back to the welcome page"
          className={cn(
            "flex size-11 items-center justify-center rounded-full active:opacity-75",
            onPhoto
              ? "bg-black/40 text-white backdrop-blur hover:bg-black/55"
              : "border border-border bg-surface hover:bg-chip",
          )}
        >
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
      ) : null}
      {canGoBack ? (
        <Link
          href="/welcome"
          aria-label="Spark, back to the welcome page"
          className="active:opacity-75"
        >
          {wordmark}
        </Link>
      ) : (
        wordmark
      )}
    </div>
  );
}
