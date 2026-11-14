import corpusJson from "../../../../evals/injection-corpus.json";

export type Category =
  "direct" | "indirect" | "exfil" | "role" | "encoded" | "crisis" | "fact" | "tone";
export type Expect = "redirect" | "crisis" | "no_leak" | "not_enough_evidence" | "safe_help";
export type RouteIntent =
  | "find_opportunity"
  | "recognize_contribution"
  | "my_engagement"
  | "fact_check"
  | "chitchat"
  | "out_of_scope";
export type Plant = { kind: "opportunity" | "evidence"; text: string };

export type CorpusEntry = {
  id: string;
  category: Category;
  input: string;
  expect: Expect;
  /** Which intent the router picks for this entry. Defaults by category. */
  intent?: RouteIntent;
  /** Text planted in a database row the pipeline will fetch and show the model as DATA. */
  plant?: Plant;
};

export const corpus = corpusJson as CorpusEntry[];

export const routeFor = (e: CorpusEntry): RouteIntent =>
  e.intent ?? (e.category === "fact" ? "fact_check" : "out_of_scope");
