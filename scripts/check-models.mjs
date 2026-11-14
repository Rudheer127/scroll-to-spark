// Usage: CEREBRAS_API_KEY=... GROQ_API_KEY=... node scripts/check-models.mjs
// Lists each configured provider's models and reports whether the IDs in
// src/features/guide/constants.ts exist. Keys come from the environment only.
const EXPECTED = {
  cerebras: {
    url: "https://api.cerebras.ai/v1/models",
    env: "CEREBRAS_API_KEY",
    ids: ["gpt-oss-120b"],
  },
  groq: {
    url: "https://api.groq.com/openai/v1/models",
    env: "GROQ_API_KEY",
    ids: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
  },
};

let missing = false;
for (const [name, cfg] of Object.entries(EXPECTED)) {
  const key = process.env[cfg.env];
  if (!key) {
    console.log(`${name}: ${cfg.env} not set, skipped`);
    continue;
  }
  try {
    const res = await fetch(cfg.url, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) {
      console.log(`${name}: HTTP ${res.status}`);
      missing = true;
      continue;
    }
    const body = await res.json();
    const have = new Set((body.data ?? []).map((m) => m.id));
    for (const id of cfg.ids) {
      const found = have.has(id);
      if (!found) missing = true;
      console.log(`${name}: ${id} ${found ? "OK" : "MISSING"}`);
    }
  } catch {
    console.log(`${name}: request failed`);
    missing = true;
  }
}
process.exit(missing ? 1 : 0);
