"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LogOut, Sprout, User } from "lucide-react";
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
  email?: string;
  signOut: () => Promise<void>;
};

/** The round avatar at the bottom left of the rail. It opens the account menu. */
export function AccountMenu({ name, email, signOut }: AccountMenuProps) {
  const [, startTransition] = useTransition();
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-(image:--gradient-spark) text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-action active:opacity-75"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuLabel className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(image:--gradient-spark) text-base font-bold text-white"
          >
            {initial}
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{name}</span>
            {email ? <span className="truncate text-xs text-muted">{email}</span> : null}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User aria-hidden className="size-4" />
            My profile
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
