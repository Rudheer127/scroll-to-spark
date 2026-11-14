import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = { label: string; href?: string };

/** Shows where you are and gives a way back up one level. The last item is the current page. */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        {items.map(({ label, href }, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={label} className="flex items-center gap-1">
              {href && !isLast ? (
                <Link href={href} className="font-semibold text-action hover:underline">
                  {label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{label}</span>
              )}
              {isLast ? null : <ChevronRight aria-hidden className="size-4" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
