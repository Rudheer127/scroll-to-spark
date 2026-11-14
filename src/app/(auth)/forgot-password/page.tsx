import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold">Forgot your password?</h2>
        <p className="text-muted">
          Enter your email and we will send you a link to choose a new one.
        </p>
      </header>
      <ForgotPasswordForm />
    </div>
  );
}
