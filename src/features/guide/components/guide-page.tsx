import { GuideChat } from "./guide-chat";

/** The full page view. It uses the whole width and the same chat as the popup. */
export function GuidePage() {
  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[28rem] flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Spark Guide</h1>
        <p className="text-muted">
          An AI helper. It can be wrong, and it never replaces a real person.
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <GuideChat variant="page" inputId="guide-input-page" />
      </div>
    </div>
  );
}
