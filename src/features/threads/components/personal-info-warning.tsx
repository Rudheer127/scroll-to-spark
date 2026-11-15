import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown when a post seems to hold a phone number or email. "Post anyway" resubmits with consent. */
export function PersonalInfoWarning({ message, pending }: { message: string; pending: boolean }) {
  return (
    <div
      role="alert"
      className="flex min-w-0 flex-col gap-3 rounded-(--radius-input) border border-danger bg-background p-4 text-sm"
    >
      <p className="flex gap-2 [overflow-wrap:anywhere]">
        <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
        {message}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="confirmPersonalInfo"
          value="1"
          variant="danger"
          disabled={pending}
        >
          Post anyway
        </Button>
        <p className="self-center text-muted">Or edit your post above and post again.</p>
      </div>
    </div>
  );
}
