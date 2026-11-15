"use client";

import Link from "next/link";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { LogOut, Settings, Sprout } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccountMenuProps = {
  name: string;
  avatarUrl?: string | null;
  email?: string;
  signOut: () => Promise<void>;
  /** Show the name beside the avatar, so the whole row opens the menu. */
  showName?: boolean;
};

/** The avatar, and optionally the name beside it, at the bottom left of the rail. All of it opens the account menu. */
export function AccountMenu({
  name,
  avatarUrl,
  email,
  signOut,
  showName = false,
}: AccountMenuProps) {
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "flex h-11 cursor-pointer items-center rounded-full outline-none hover:bg-chip focus-visible:ring-2 focus-visible:ring-action active:opacity-75",
          showName
            ? "min-w-0 flex-1 gap-2 pr-3"
            : "w-11 shrink-0 justify-center hover:bg-transparent",
        )}
      >
        <UserAvatar name={name} url={avatarUrl} className="text-sm" />
        {showName ? (
          <span
            data-sidebar-expanded-only
            title={name}
            className="min-w-0 flex-1 truncate text-left text-[0.9375rem] font-semibold"
          >
            {name}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuLabel className="flex items-center gap-3">
          <UserAvatar name={name} url={avatarUrl} className="size-10 text-base" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{name}</span>
            {email ? <span className="truncate text-xs text-muted">{email}</span> : null}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/steps">
            <Sprout aria-hidden className="size-4" />
            My steps
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onSelect={() => startTransition(() => signOut())}>
          <LogOut aria-hidden className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
