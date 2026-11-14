export type InjectionSignal =
  | "ignore_instructions"
  | "reveal_prompt"
  | "role_override"
  | "fake_delimiter"
  | "encoded_blob"
  | "tool_coercion";

const GAP = String.raw`(?:\W+\w+){0,3}?\W+`;
const OVERRIDE_VERB = String.raw`(?:ignore|disregard|forget|override|bypass)`;
const SCOPE = String.raw`(?:previous|prior|above|earlier|preceding|all|any|your|system|initial|original|these|those|every)`;
const RULES = String.raw`(?:instructions?|rules|prompts?|guidelines|directions|directives)`;
const ES_VERB = String.raw`(?:ignora|ignoren|ignorar|olvida|olvidar|descarta|omite|salta|desobedece)`;
const ES_RULES = String.raw`(?:instrucciones|reglas|indicaciones|directrices|normas)`;

/** Patterns run on sanitized text. All are case-insensitive. */
const PATTERNS: Record<InjectionSignal, RegExp[]> = {
  ignore_instructions: [
    new RegExp(String.raw`\b${OVERRIDE_VERB}\b${GAP}${SCOPE}\b${GAP}?${RULES}\b`, "i"),
    new RegExp(
      String.raw`\b${OVERRIDE_VERB}\b\W+(?:everything|all|anything)\W+(?:\w+\W+){0,2}?(?:above|before|earlier|previously|said)\b`,
      "i",
    ),
    new RegExp(
      String.raw`\b${OVERRIDE_VERB}\b\W+(?:the\W+)?(?:previous|prior|above|preceding)\b(?=\W*(?:$|and\b|then\b|instructions?\b|messages?\b|rules\b|prompts?\b|text\b|context\b|conversation\b|everything\b))`,
      "i",
    ),
    new RegExp(
      String.raw`\bskip\W+(?:all\W+|any\W+|the\W+)?(?:previous|prior|above|your|system)\W+${RULES}\b`,
      "i",
    ),
    new RegExp(String.raw`\b${ES_VERB}\b${GAP}${ES_RULES}\b`, "i"),
    /\bnew\s+instructions?\s*:/i,
  ],
  reveal_prompt: [
    /\b(?:print|show|reveal|repeat|output|display|tell|give|leak|share|write|recite|dump)\b(?:\W+\w+){0,4}?\W+(?:system|initial|hidden|original|developer|secret|internal)\W+(?:prompt|instructions?|message|rules)\b/i,
    /\bwhat\s+(?:is|are|were)\s+your\s+(?:(?:system|initial|original|hidden)\s+)?(?:prompt|instructions?|rules)\b/i,
    /\b(?:system|developer)\s+prompt\b/i,
    /\b(?:muestra|revela|imprime|repite|dime|dame|di|comparte)\b(?:\W+\w+){0,4}?\W+(?:prompt|instrucciones)\s+(?:del\s+sistema|iniciales|ocultas|originales|internas)/i,
    /\b(?:revela|muestra|repite|imprime)\b(?:\W+\w+){0,2}?\W+(?:tu|su)\s+prompt\b/i,
  ],
  role_override: [
    /\byou\s+are\s+now\b(?!\s+my\s+(?:favou?rite|best|good)\b)/i,
    /\bfrom\s+now\s+on\s*,?\s+you\b/i,
    /\bdo\s+anything\s+now\b/i,
    /\b(?:developer|god|jailbreak|jailbroken|unrestricted)\s+mode\b/i,
    /\bjailbreak(?:ed)?\b/i,
    /\b(?:pretend|act|behave)\b(?:\W+\w+){0,3}?\W+(?:as\W+if\W+)?(?:you\W+(?:are|were)|to\W+be|as)\W+(?:\w+\W+){0,2}?(?:unrestricted|unfiltered|jailbroken|dan|evil|no\W+(?:rules|restrictions))/i,
    /\ba\s+partir\s+de\s+ahora\s*,?\s+(?:eres|act[uú]a|te\s+comportas)\b/i,
    /\bahora\s+eres\b/i,
    /\b(?:finge|simula|haz\s+como\s+si)\b(?:\W+\w+){0,2}?\W+(?:ser|eres|fueras)\b/i,
  ],
  fake_delimiter: [
    /<\s*\/?\s*(?:system|assistant|user|instructions?|developer|prompt)\s*>/i,
    /\[\s*\/?\s*(?:INST|SYS|SYSTEM)\s*\]/i,
    /<<\s*\/?\s*(?:SYS|DATA|END)\b/i,
    /<\|[a-z_ ]{2,30}\|>/i,
    /^\s*(?:system|assistant|developer)\s*:/i,
    /\b(?:system|assistant|developer)\s*:\s*(?:you|ignore|disregard|forget|new|from\s+now|do\s+not|never|always|act|reveal|output|print)\b/i,
    /#{2,}\s*(?:system|instructions?)\b/i,
  ],
  encoded_blob: [/[A-Za-z0-9+/]{100,}={0,2}/, /\b[0-9a-f]{64,}\b/i],
  tool_coercion: [
    /\b(?:call|invoke|execute|trigger)\W+(?:\w+\W+){0,2}?(?:function|tool|api|endpoint|command)\b(?!\W+librar)/i,
    /\brun\W+(?:this|the|a|my)\W+(?:\w+\W+){0,1}?(?:command|script|query|code|shell)\b/i,
    /\b(?:tool_calls?|function_call)\b/i,
    /\b(?:drop|truncate)\s+table\b/i,
    /\bdelete\s+from\s+\w+/i,
    /\bselect\s+\*\s+from\b/i,
    /\bsend\s+(?:an?\s+)?(?:email|message|request)\s+to\b(?!\s+(?:my|our)\b)/i,
  ],
};

/** Letters-only patterns that catch spaced out or punctuation separated attacks. */
const SQUASHED: Partial<Record<InjectionSignal, RegExp[]>> = {
  ignore_instructions: [
    /(?:ignore|disregard|forget|override)(?:all|any|the|your|every)?(?:previous|prior|above|earlier|preceding|initial|original|system)(?:instructions?|rules|prompts?|guidelines)/,
    /(?:ignora|olvida|descarta)(?:todas)?(?:las|tus|mis)?(?:instrucciones|reglas)/,
  ],
  reveal_prompt: [
    /(?:print|show|reveal|repeat|output|leak)(?:me)?(?:your|the)(?:system|initial|hidden|original)(?:prompt|instructions?)/,
  ],
  role_override: [/youarenow(?:dan|an?unrestricted|jailbroken)/, /doanythingnow/],
};

/** Long links are not encoded payloads, so the blob check ignores them. */
const URL_RUN = /https?:\/\/\S+/gi;

/** Removes everything but letters so "i g n o r e" and "i.g.n.o.r.e" collapse. */
function squash(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}]/gu, "");
}

/** Returns the distinct injection signals found in already sanitized text. */
export function detectInjectionSignals(text: string): InjectionSignal[] {
  const squashed = squash(text);
  const found: InjectionSignal[] = [];
  const noUrls = text.replace(URL_RUN, " ");
  for (const signal of Object.keys(PATTERNS) as InjectionSignal[]) {
    const subject = signal === "encoded_blob" ? noUrls : text;
    const hit =
      PATTERNS[signal].some((re) => re.test(subject)) ||
      (SQUASHED[signal] ?? []).some((re) => re.test(squashed));
    if (hit) found.push(signal);
  }
  return found;
}
