import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";

/** A plain search form. It works without scripts: it reloads the page with ?q= in the address. */
export function GroupSearch({ query }: { query: string }) {
  return (
    <form action="/discussions" role="search" className="flex flex-wrap items-center gap-2">
      <label htmlFor="group-search" className="sr-only">
        Search groups
      </label>
      <input
        id="group-search"
        name="q"
        type="search"
        defaultValue={query}
        placeholder="Search groups by name or topic"
        className={`${inputClass} max-w-md`}
      />
      <Button type="submit" variant="outline">
        <Search aria-hidden className="size-4" />
        Search
      </Button>
      {query ? (
        <Link href="/discussions" className="text-sm font-semibold text-action hover:underline">
          Clear search
        </Link>
      ) : null}
    </form>
  );
}
