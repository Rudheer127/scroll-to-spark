// Usage: node scripts/check-models.mjs
// Optional env: OPENROUTER_API_KEY, CEREBRAS_API_KEY, GROQ_API_KEY, the OPENROUTER_MODEL_* names,
// GUIDE_VISION_MODEL and GUIDE_VISION_PROVIDER. Keys come from the environment only and are never
// printed.
//
// OpenRouter: the public model list needs no key. Each configured id must exist and support
// structured outputs, and the vision id must take image input. With a key, the key's limit and
// credits are printed (numbers only).
// Cerebras and Groq: their model lists need a key and do not say which models read images, so
// this only checks that the ids exist.

// Keep in step with OPENROUTER_DEFAULTS in src/lib/env.ts.
const OPENROUTER_DEFAULTS = {
  main: "nvidia/nemotron-3.5-super-vl:free",
  fast: "inclusionai/ling-3.2-flash:free",
  fallback: "openrouter/free",
  vision: "nvidia/nemotron-3.5-super-vl:free",
};

const env = (name) => (process.env[name] ? process.env[name] : undefined);
const visionProvider = env("GUIDE_VISION_PROVIDER");
const visionModel = env("GUIDE_VISION_MODEL");

const KEYED = {
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

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) return { status: res.status, body: null };
  return { status: res.status, body: await res.json() };
}

async function checkOpenRouter() {
  const wanted = {
    main: env("OPENROUTER_MODEL_MAIN") ?? OPENROUTER_DEFAULTS.main,
    fast: env("OPENROUTER_MODEL_FAST") ?? OPENROUTER_DEFAULTS.fast,
    fallback: env("OPENROUTER_MODEL_FALLBACK") ?? OPENROUTER_DEFAULTS.fallback,
    vision:
      visionModel && (visionProvider ?? "openrouter") === "openrouter"
        ? visionModel
        : OPENROUTER_DEFAULTS.vision,
  };
  const { status, body } = await getJson("https://openrouter.ai/api/v1/models");
  if (!body) {
    console.log(`openrouter: model list HTTP ${status}`);
    missing = true;
    return;
  }
  const byId = new Map((body.data ?? []).map((m) => [m.id, m]));
  for (const [role, id] of Object.entries(wanted)) {
    const model = byId.get(id);
    if (!model) {
      console.log(`openrouter: ${role} ${id} MISSING`);
      missing = true;
      continue;
    }
    const structured = (model.supported_parameters ?? []).includes("structured_outputs");
    const image = (model.architecture?.input_modalities ?? []).includes("image");
    const ok = structured && (role !== "vision" || image);
    if (!ok) missing = true;
    console.log(
      `openrouter: ${role} ${id} ${ok ? "OK" : "NOT SUITABLE"} (structured_outputs ${structured ? "yes" : "no"}, image input ${image ? "yes" : "no"})`,
    );
  }
  await printKeyStatus();
}

async function printKeyStatus() {
  const key = env("OPENROUTER_API_KEY");
  if (!key) {
    console.log("openrouter: OPENROUTER_API_KEY not set, key status skipped");
    return;
  }
  const auth = { Authorization: `Bearer ${key}` };
  const keyInfo = await getJson("https://openrouter.ai/api/v1/key", auth);
  const data = keyInfo.body?.data ?? {};
  console.log(
    `openrouter key: HTTP ${keyInfo.status}, limit ${data.limit ?? "none"}, limit_remaining ${data.limit_remaining ?? "none"}, usage ${data.usage ?? "unknown"}`,
  );
  const credits = await getJson("https://openrouter.ai/api/v1/credits", auth);
  const c = credits.body?.data ?? {};
  console.log(
    `openrouter credits: HTTP ${credits.status}, total_credits ${c.total_credits ?? "unknown"}, total_usage ${c.total_usage ?? "unknown"}`,
  );
}

async function checkKeyed(name, cfg) {
  const key = env(cfg.env);
  if (!key) {
    console.log(`${name}: ${cfg.env} not set, skipped`);
    return;
  }
  const ids = [...cfg.ids, ...(visionModel && visionProvider === name ? [visionModel] : [])];
  const { status, body } = await getJson(cfg.url, { Authorization: `Bearer ${key}` });
  if (!body) {
    console.log(`${name}: HTTP ${status}`);
    missing = true;
    return;
  }
  const have = new Set((body.data ?? []).map((m) => m.id));
  for (const id of ids) {
    const found = have.has(id);
    if (!found) missing = true;
    console.log(`${name}: ${id} ${found ? "OK" : "MISSING"}`);
  }
}

try {
  await checkOpenRouter();
} catch {
  console.log("openrouter: request failed");
  missing = true;
}
for (const [name, cfg] of Object.entries(KEYED)) {
  try {
    await checkKeyed(name, cfg);
  } catch {
    console.log(`${name}: request failed`);
    missing = true;
  }
}
process.exit(missing ? 1 : 0);
