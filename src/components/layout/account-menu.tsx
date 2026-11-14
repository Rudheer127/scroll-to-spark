"use client";

import Link from "next/link";
import { useTransition } from "react";
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
};

/** The round avatar at the bottom left of the rail. It opens the account menu. */
export function AccountMenu({ name, avatarUrl, email, signOut }: AccountMenuProps) {
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-action active:opacity-75"
      >
        <UserAvatar name={name} url={avatarUrl} className="text-sm" />
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
