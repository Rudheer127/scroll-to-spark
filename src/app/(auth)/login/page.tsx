import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="flex max-w-md flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold">Log in</h2>
        <p className="text-muted">Welcome back.</p>
      </header>
      {error === "confirm" ? (
        <p role="alert" className="text-sm text-danger">
          We could not sign you in from that link. If you already confirmed your email, log in
          below.
        </p>
      ) : null}
      <LoginForm />
    </div>
  );
}
