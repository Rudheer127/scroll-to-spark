import { cn } from "@/lib/cn";

const VARIANTS = {
  primary: "bg-ink text-white hover:opacity-90",
  brand: "bg-cta text-white hover:opacity-90",
  outline: "border border-border bg-background text-ink hover:bg-chip",
  ghost: "hover:bg-chip",
  danger: "bg-danger text-white hover:opacity-90",
  join: "bg-join text-white hover:opacity-90",
  spark: "bg-(image:--gradient-spark) text-white hover:opacity-90",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/** The shared look of buttons, so a link that acts like a button matches a real button. */
export function buttonClasses(variant: ButtonVariant = "primary", className?: string): string {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-control) px-5 py-2.5 text-sm font-extrabold active:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10",
    VARIANTS[variant],
    className,
  );
}

type ButtonProps = React.ComponentProps<"button"> & { variant?: ButtonVariant };

/** The one button. Every clickable action in the app uses it. At least 44px tall on small screens. */
export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
