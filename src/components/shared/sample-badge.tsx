/** Marks content that belongs to the demo data, so nobody mistakes it for real people. */
export function SampleBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-lavender-soft px-2.5 py-0.5 text-xs font-semibold text-lavender-ink">
      Sample data
    </span>
  );
}
