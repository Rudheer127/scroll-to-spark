import { cn } from "@/lib/cn";

const VARIANTS = {
  primary: "bg-action text-white hover:opacity-90",
  gradient:
    "bg-linear-to-r from-brand-orange via-brand-pink to-brand-purple text-white hover:opacity-90",
  outline: "border border-border bg-surface hover:bg-background",
  ghost: "hover:bg-chip",
  danger: "bg-danger text-white hover:opacity-90",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

type ButtonProps = React.ComponentProps<"button"> & { variant?: ButtonVariant };

/** The one button. Every clickable action in the app uses it. */
export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-(--radius-control) px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
