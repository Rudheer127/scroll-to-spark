import { Suspense } from "react";

/** Sign-in screens use the whole window: a brand panel on the left and the form on the right. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col gap-6 border-b border-border bg-surface px-10 py-12 lg:border-r lg:border-b-0 lg:px-16 lg:py-20">
        <p className="text-5xl font-bold">Spark</p>
        <h1 className="max-w-xl text-4xl font-bold leading-tight">
          Do one small thing for your community.
        </h1>
        <ul className="flex max-w-xl flex-col gap-3 text-lg text-muted">
          <li>Join groups for the causes you care about.</li>
          <li>Start a group of your own for a cause that matters to you.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-8 px-10 py-12 lg:px-16 lg:py-20">
        <Suspense fallback={null}>{children}</Suspense>
      </section>
    </div>
  );
}
