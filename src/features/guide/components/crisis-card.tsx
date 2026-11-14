import { Phone } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

/** Shown when the turn was a crisis reply. Plain links, no model text, nothing to dismiss. */
export function CrisisCard() {
  return (
    <section
      aria-label="Get help now"
      className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-4"
    >
      <h3 className="text-base font-bold">Talk to a person now</h3>
      <div className="flex flex-wrap gap-2">
        <a href="tel:988" className={buttonClasses("primary")}>
          <Phone aria-hidden className="size-4" />
          Call 988
        </a>
        <a href="sms:988" className={buttonClasses("outline")}>
          Text 988
        </a>
      </div>
      <p className="text-sm text-muted">If you are in danger, call 911.</p>
    </section>
  );
}
