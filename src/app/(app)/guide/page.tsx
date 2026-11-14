import { GuidePage } from "@/features/guide/components/guide-page";
import { loadChatForCaller } from "@/features/guide/load-chat";

export default async function GuideRoute({ searchParams }: PageProps<"/guide">) {
  const { chat: chatParam } = await searchParams;
  const requested = typeof chatParam === "string" ? chatParam : null;
  const chat = requested === null ? null : await loadChatForCaller(requested);
  return <GuidePage requested={requested} chat={chat} />;
}
