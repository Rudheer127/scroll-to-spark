import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold">Choose a new password</h2>
        <p className="text-muted">You will be signed in as soon as it is saved.</p>
      </header>
      <ResetPasswordForm />
    </div>
  );
}
