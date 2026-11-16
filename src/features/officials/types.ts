/** Where an official sits. "local" is reserved for a later source (mayors, councils, school boards). */
export type Level = "federal" | "state" | "local";

export const LEVELS: { value: Level; label: string }[] = [
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
  { value: "local", label: "Local" },
];

export type Social = { network: "twitter" | "facebook" | "youtube" | "instagram"; handle: string };

/** One person who represents you, in the single shape every source is turned into. */
export type Official = {
  /** Stable id: "federal:B000944" or "state:ocd-person/…". */
  id: string;
  level: Level;
  name: string;
  /** e.g. "U.S. Senator", "U.S. Representative", "State Senator". */
  office: string;
  /** 2-letter state code. */
  state: string;
  /** House or state district; null for senators. 0 means at large. */
  district: number | string | null;
  party: string;
  /** ISO date the current term ends, when the source gives it. */
  termEnd: string | null;
  photoUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  contactForm: string | null;
  address: string | null;
  socials: Social[];
  /** Federal only: the OpenFEC candidate id used to look up funding. */
  fecId: string | null;
  /** Federal only: the Bioguide id (also the photo key). */
  bioguide: string | null;
  isSenator: boolean;
};

export type FundingSummary = {
  candidateName: string;
  /** Election cycle the numbers are for, e.g. 2026. */
  cycle: number;
  /** Reporting period the totals cover. */
  coverageStart: string | null;
  coverageEnd: string | null;
  /** Null when the FEC did not report that figure. Never shown as $0. */
  receipts: number | null;
  disbursements: number | null;
  cashOnHand: number | null;
  individual: number | null;
  committees: number | null;
  /** Largest employers of individual donors (FEC has no sector data). */
  topEmployers: { employer: string; total: number }[];
  fecUrl: string;
};

export type StateStatus = "ok" | "missing-key" | "down";

export type LookupResult = {
  location: { zip: string; city: string; state: string };
  officials: Official[];
  /** "exact": the House member is certain. "choose": the ZIP may touch several districts. */
  houseMode: "exact" | "choose";
  districtCount: number;
  /** The district at the ZIP's centre, offered as the likely one. */
  likelyDistrict: number | null;
  stateStatus: StateStatus;
  /** True when state legislators came from the ZIP's centre point rather than an exact location. */
  stateApproximate: boolean;
};

export type RecentLookup = { zip: string; city: string; state: string };
