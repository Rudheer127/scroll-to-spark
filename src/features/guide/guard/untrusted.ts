export type UntrustedLabel = "user_message" | "opportunity" | "evidence" | "contribution";

/** 12 hex chars from the platform CSPRNG. */
export function newNonce(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A fresh secret per request: "CANARY-" plus 16 hex chars from the platform CSPRNG. */
export function newCanary(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `CANARY-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Fences untrusted content so it cannot forge or close its own delimiter. */
export function wrapUntrusted(label: UntrustedLabel, content: string, nonce: string): string {
  const safe = content
    .replace(/<+/g, (run) => run.split("").join(" "))
    .replace(/>+/g, (run) => run.split("").join(" "))
    .replaceAll(nonce, "[id]");
  return `<<DATA label=${label} id=${nonce}>>\n${safe}\n<<END id=${nonce}>>`;
}
