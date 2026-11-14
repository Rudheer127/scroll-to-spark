/**
 * Quick ways to start a chat by naming a feeling. Picking one sends the message to the guide
 * as if the person typed it, so it goes through the same checks as any other message.
 */
export const MOODS = [
  { id: "overwhelmed", label: "Overwhelmed", message: "I'm feeling overwhelmed" },
  { id: "angry", label: "Angry", message: "I'm feeling angry" },
  { id: "sad", label: "Sad", message: "I'm feeling sad" },
  { id: "restless", label: "Restless", message: "I'm feeling restless" },
  { id: "ready", label: "Ready for more", message: "I'm ready for more" },
] as const satisfies readonly { id: string; label: string; message: string }[];
