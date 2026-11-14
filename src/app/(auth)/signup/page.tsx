import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold">Create your account</h2>
        <p className="text-muted">It takes under a minute.</p>
      </header>
      <SignupForm />
    </div>
  );
}
