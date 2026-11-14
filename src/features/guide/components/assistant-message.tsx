import { CrisisCard } from "./crisis-card";
import { ConfirmContributionCard } from "./confirm-contribution-card";
import { EvidenceCard } from "./evidence-card";
import { LoggedCard } from "./logged-card";
import { MessageBubble } from "./message-bubble";
import { OpportunityCard } from "./opportunity-card";
import type { MessageView } from "./to-message-view";

/** One answer: the labeled text first, then only the cards the server built from database rows. */
export function AssistantMessage({ view }: { view: MessageView }) {
  const hasExtras = view.kind === "crisis" || view.cards.length > 0 || view.proposal !== null;
  return (
    <div className="flex flex-col gap-3">
      <MessageBubble role="assistant" label={view.label}>
        {view.text}
        {view.waitNote ? (
          <span className="mt-2 block text-sm text-muted">{view.waitNote}</span>
        ) : null}
      </MessageBubble>
      {hasExtras ? (
        <div className="flex max-w-[70ch] flex-col gap-3">
          {view.kind === "crisis" ? <CrisisCard /> : null}
          {view.cards.map((card) => {
            if (card.kind === "opportunity") return <OpportunityCard key={card.id} card={card} />;
            if (card.kind === "evidence") return <EvidenceCard key={card.id} card={card} />;
            return <LoggedCard key={card.id} card={card} />;
          })}
          {view.proposal ? <ConfirmContributionCard proposal={view.proposal} /> : null}
        </div>
      ) : null}
    </div>
  );
}
