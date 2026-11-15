import Link from "next/link";

export default function ThreadNotFound() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="text-3xl font-bold">We could not find that thread</h1>
      <p className="text-muted">
        It may have been deleted or hidden after reports, or the link may be wrong.{" "}
        <Link href="/discussions" className="font-semibold text-action hover:underline">
          Back to discussions
        </Link>
      </p>
    </div>
  );
}
