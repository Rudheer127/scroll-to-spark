import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { ConfirmationWatcher } from "@/features/auth/components/confirmation-watcher";
import { ResendButton } from "@/features/auth/components/resend-button";
import { getPendingEmail } from "@/features/auth/pending-email";

const STEPS = [
  "Open the email from us. If it is not there, check your spam folder.",
  "Click the link inside it.",
  "This page signs you in by itself. You do not need to come back and press anything.",
];

export default async function CheckEmailPage() {
  const email = await getPendingEmail();
  if (!email) redirect("/signup");

  return (
    <div className="flex max-w-lg flex-col gap-7">
      <ConfirmationWatcher />
      <header className="flex flex-col gap-4">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-chip">
          <Mail aria-hidden className="size-7" />
        </span>
        <h2 className="text-3xl font-bold">Check your email</h2>
        <p className="text-lg">
          We sent a confirmation link to <strong className="font-bold break-all">{email}</strong>.
        </p>
      </header>
      <ol className="flex list-decimal flex-col gap-3 pl-5 text-muted marker:font-semibold marker:text-ink">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <ResendButton />
      <p className="flex flex-col gap-1 text-sm text-muted">
        <span>
          Wrong address?{" "}
          <Link href="/signup" className="font-semibold text-action">
            Sign up again
          </Link>
        </span>
        <span>
          Already confirmed?{" "}
          <Link href="/login" className="font-semibold text-action">
            Log in
          </Link>
        </span>
      </p>
    </div>
  );
}
