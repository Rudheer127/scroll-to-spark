const ROWS = ["w-4/5", "w-3/5", "w-2/3", "w-1/2"];

/** A placeholder shaped like the chat list while it loads. */
export function ChatHistorySkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-1 px-3.5 py-1 motion-safe:animate-pulse">
      <span className="sr-only">Loading your chats</span>
      {ROWS.map((width) => (
        <div key={width} className="flex h-11 flex-col justify-center gap-1.5">
          <div className={`h-3 rounded-full bg-chip ${width}`} />
          <div className="h-2.5 w-12 rounded-full bg-chip" />
        </div>
      ))}
    </div>
  );
}
