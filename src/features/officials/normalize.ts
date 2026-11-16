import { z } from "zod";
import type { FundingSummary, Official, Social } from "@/features/officials/types";

const PHOTO_BASE = "https://unitedstates.github.io/images/congress/225x275";

export function bioguidePhoto(bioguide: string): string {
  return `${PHOTO_BASE}/${bioguide}.jpg`;
}

const termSchema = z.object({
  type: z.enum(["sen", "rep"]),
  start: z.string(),
  end: z.string(),
  state: z.string(),
  district: z.number().optional(),
  party: z.string().optional(),
  url: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  office: z.string().optional(),
  contact_form: z.string().optional(),
  state_rank: z.string().optional(),
});

const legislatorSchema = z.object({
  id: z.object({ bioguide: z.string(), fec: z.array(z.string()).optional() }),
  name: z.object({ first: z.string(), last: z.string(), official_full: z.string().optional() }),
  terms: z.array(termSchema).min(1),
});

const socialSchema = z.object({
  id: z.object({ bioguide: z.string() }),
  social: z
    .object({
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      youtube: z.string().optional(),
      instagram: z.string().optional(),
    })
    .partial(),
});

/** Only http(s) links are kept, so a bad value in a source can never become a javascript: link. */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function socialsFor(raw: z.infer<typeof socialSchema>["social"] | undefined): Social[] {
  if (!raw) return [];
  const out: Social[] = [];
  for (const network of ["twitter", "facebook", "youtube", "instagram"] as const) {
    const handle = raw[network];
    if (handle && /^[\w.-]{1,60}$/.test(handle)) out.push({ network, handle });
  }
  return out;
}

export function socialUrl({ network, handle }: Social): string {
  const base = {
    twitter: "https://x.com/",
    facebook: "https://www.facebook.com/",
    youtube: "https://www.youtube.com/@",
    instagram: "https://www.instagram.com/",
  }[network];
  return base + handle;
}

/** Joins the congress-legislators "current" and "social media" files into compact Officials. */
export function normalizeFederal(legislators: unknown, social: unknown): Official[] {
  const socials = new Map<string, Social[]>();
  if (Array.isArray(social)) {
    for (const row of social) {
      const parsed = socialSchema.safeParse(row);
      if (parsed.success) socials.set(parsed.data.id.bioguide, socialsFor(parsed.data.social));
    }
  }
  if (!Array.isArray(legislators)) return [];
  const out: Official[] = [];
  for (const row of legislators) {
    const parsed = legislatorSchema.safeParse(row);
    if (!parsed.success) continue;
    const { id, name, terms } = parsed.data;
    const term = terms[terms.length - 1];
    const isSenator = term.type === "sen";
    const fec = id.fec?.find((value) => value.startsWith(isSenator ? "S" : "H")) ?? null;
    out.push({
      id: `federal:${id.bioguide}`,
      level: "federal",
      name: name.official_full ?? `${name.first} ${name.last}`,
      office: isSenator ? "U.S. Senator" : "U.S. Representative",
      state: term.state,
      district: isSenator ? null : (term.district ?? 0),
      party: term.party ?? "Unknown",
      termEnd: term.end,
      photoUrl: bioguidePhoto(id.bioguide),
      phone: term.phone ?? null,
      email: null,
      website: safeUrl(term.url),
      contactForm: safeUrl(term.contact_form),
      address: term.address ?? term.office ?? null,
      socials: socials.get(id.bioguide) ?? [],
      fecId: fec,
      bioguide: id.bioguide,
      isSenator,
    });
  }
  return out;
}

const openStatesPerson = z.object({
  id: z.string(),
  name: z.string(),
  party: z.string().nullish(),
  image: z.string().nullish(),
  email: z.string().nullish(),
  openstates_url: z.string().nullish(),
  current_role: z
    .object({
      title: z.string().nullish(),
      org_classification: z.string().nullish(),
      district: z.union([z.string(), z.number()]).nullish(),
    })
    .nullish(),
  jurisdiction: z.object({ name: z.string().nullish(), id: z.string().nullish() }).nullish(),
  offices: z
    .array(z.object({ voice: z.string().nullish(), address: z.string().nullish() }))
    .nullish(),
});

/** Turns an Open States people.geo answer into Officials. `state` is the 2-letter code of the ZIP. */
export function normalizeOpenStates(body: unknown, state: string): Official[] {
  const results = (body as { results?: unknown })?.results;
  if (!Array.isArray(results)) return [];
  const out: Official[] = [];
  for (const row of results) {
    const parsed = openStatesPerson.safeParse(row);
    if (!parsed.success) continue;
    const p = parsed.data;
    const chamber = p.current_role?.org_classification;
    if (chamber !== "upper" && chamber !== "lower") continue;
    const office =
      p.current_role?.title ?? (chamber === "upper" ? "State Senator" : "State Representative");
    const image = p.image && p.image.startsWith("https://") ? p.image : null;
    out.push({
      id: `state:${p.id}`,
      level: "state",
      name: p.name,
      office,
      state,
      district: p.current_role?.district != null ? String(p.current_role.district) : null,
      party: p.party ?? "Unknown",
      termEnd: null,
      photoUrl: image,
      phone: p.offices?.find((o) => o.voice)?.voice ?? null,
      email: p.email ?? null,
      website: safeUrl(p.openstates_url),
      contactForm: null,
      address: p.offices?.find((o) => o.address)?.address ?? null,
      socials: [],
      fecId: null,
      bioguide: null,
      isSenator: chamber === "upper",
    });
  }
  return out;
}

/** The short party word used on chips: "Democrat" -> "Democratic" style kept as the source says. */
export function partyTone(party: string): "blue" | "red" | "other" {
  const p = party.toLowerCase();
  if (p.startsWith("dem")) return "blue";
  if (p.startsWith("rep")) return "red";
  return "other";
}

const totalsRow = z.object({
  cycle: z.number().nullish(),
  coverage_start_date: z.string().nullish(),
  coverage_end_date: z.string().nullish(),
  receipts: z.number().nullish(),
  disbursements: z.number().nullish(),
  last_cash_on_hand_end_period: z.number().nullish(),
  individual_contributions: z.number().nullish(),
  other_political_committee_contributions: z.number().nullish(),
});

export function fecCandidateUrl(fecId: string): string {
  return `https://www.fec.gov/data/candidate/${encodeURIComponent(fecId)}/`;
}

/** Builds a FundingSummary from the OpenFEC totals and by_employer answers. Null when there are no totals. */
export function normalizeFunding(
  fecId: string,
  candidateName: string,
  totalsBody: unknown,
  employerBody: unknown,
): FundingSummary | null {
  const rows = (totalsBody as { results?: unknown })?.results;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const parsed = totalsRow.safeParse(rows[0]);
  if (!parsed.success) return null;
  const t = parsed.data;
  const employers = (employerBody as { results?: unknown })?.results;
  const topEmployers: FundingSummary["topEmployers"] = [];
  if (Array.isArray(employers)) {
    for (const row of employers) {
      const r = row as { employer?: unknown; total?: unknown };
      if (typeof r.employer !== "string" || typeof r.total !== "number") continue;
      // FEC lists non-answers as employers; they say nothing about who gives.
      if (
        /^(NOT EMPLOYED|SELF[- ]EMPLOYED|NULL|NONE|N\/A|RETIRED|INFORMATION REQUESTED.*)$/i.test(
          r.employer.trim(),
        )
      )
        continue;
      topEmployers.push({ employer: r.employer, total: r.total });
      if (topEmployers.length === 5) break;
    }
  }
  return {
    candidateName,
    cycle: t.cycle ?? (Number((t.coverage_end_date ?? "").slice(0, 4)) || 0),
    coverageStart: t.coverage_start_date?.slice(0, 10) ?? null,
    coverageEnd: t.coverage_end_date?.slice(0, 10) ?? null,
    receipts: t.receipts ?? 0,
    disbursements: t.disbursements ?? 0,
    cashOnHand: t.last_cash_on_hand_end_period ?? null,
    individual: t.individual_contributions ?? 0,
    committees: t.other_political_committee_contributions ?? 0,
    topEmployers,
    fecUrl: fecCandidateUrl(fecId),
  };
}
