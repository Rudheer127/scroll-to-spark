import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h2 className="text-4xl font-bold">Welcome back</h2>
        <p className="text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-action hover:underline">
            Sign up
          </Link>
        </p>
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
