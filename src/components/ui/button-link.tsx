import Link from "next/link";
import { buttonClasses, type ButtonVariant } from "@/components/ui/button";

type ButtonLinkProps = React.ComponentProps<typeof Link> & { variant?: ButtonVariant };

/** A link that looks like a button. Use it when the action is going to another page. */
export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
