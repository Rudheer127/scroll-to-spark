import { cn } from "@/lib/cn";

type IconButtonProps = Omit<React.ComponentProps<"button">, "aria-label"> & {
  /** Every icon button has a name, since the icon alone says nothing to a screen reader. */
  label: string;
};

/** A quiet round button that holds one icon. 44px on small screens, a little smaller on desktop. */
export function IconButton({ label, className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-ink active:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 md:size-9",
        className,
      )}
      {...props}
    />
  );
}
