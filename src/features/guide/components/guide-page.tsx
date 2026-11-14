import { AiChip } from "./ai-chip";
import { GuideChat } from "./guide-chat";
import { GUIDE_SUBTITLE } from "./guide-copy";
import { NewChatButton } from "./new-chat-button";

/**
 * The full page view: a small, quiet title row, then the chat filling the rest of the height.
 * It shows the same conversation as the popup.
 */
export function GuidePage() {
  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[28rem] flex-col gap-2">
      <header className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Spark Guide</h1>
            <AiChip />
          </div>
          <p className="text-sm text-muted">{GUIDE_SUBTITLE}</p>
        </div>
        <div className="shrink-0">
          <NewChatButton />
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <GuideChat variant="page" inputId="guide-input-page" />
      </div>
    </div>
  );
}
