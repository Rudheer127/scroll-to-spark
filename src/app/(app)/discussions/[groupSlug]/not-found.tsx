import Link from "next/link";

export default function GroupNotFound() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="text-3xl font-bold">We could not find that group</h1>
      <p className="text-muted">
        It may have been deleted, or the address may be wrong.{" "}
        <Link href="/discussions" className="font-semibold text-action hover:underline">
          Browse all groups
        </Link>
      </p>
    </div>
  );
}
