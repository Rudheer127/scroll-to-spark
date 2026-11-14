/** Placeholder shown while a screen loads. It matches the layout of a typical page: a title and a grid. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex animate-pulse flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-56 rounded-lg bg-chip" />
        <div className="h-4 w-80 rounded-lg bg-chip" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-40 rounded-(--radius-card) shadow-card bg-chip" />
        ))}
      </div>
    </div>
  );
}
