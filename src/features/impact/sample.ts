/**
 * A made-up example of what "your impact" could look like once enough real data exists. Nothing
 * here is real: the town, the group and the people are invented, and the page says so. It is
 * nonpartisan on purpose: it follows a small local action, not a party or a candidate.
 */
export type ImpactEvent = { when: string; title: string; detail: string };
export type ImpactChange = { label: string; before: string; after: string };
export type ImpactPerson = { name: string; role: string };

export type SampleImpact = {
  isSample: true;
  action: { title: string; when: string; minutes: number; group: string };
  summary: string;
  timeline: ImpactEvent[];
  changes: ImpactChange[];
  people: ImpactPerson[];
  numbers: { label: string; value: string }[];
  next: { title: string; href: string; label: string };
};

export const SAMPLE_IMPACT: SampleImpact = {
  isSample: true,
  action: {
    title: "You emailed the council about the Willow Park cleanup",
    when: "Last Monday",
    minutes: 15,
    group: "Riverbend Neighbors (sample group)",
  },
  summary:
    "You were one of 42 people who wrote in. The council added the cleanup to its agenda and approved it this week.",
  timeline: [
    {
      when: "Monday",
      title: "You sent your note",
      detail: "Fifteen minutes, one short email about the litter along the creek path.",
    },
    {
      when: "Wednesday",
      title: "The group thanked you",
      detail: "Riverbend Neighbors replied and said 42 notes had arrived that week.",
    },
    {
      when: "Thursday",
      title: "It reached the agenda",
      detail: "The parks committee put the cleanup on Friday's meeting.",
    },
    {
      when: "Friday",
      title: "The council voted yes",
      detail: "Approved 5 to 2, with a first volunteer day set for next month.",
    },
  ],
  changes: [
    { label: "Cleanup funding", before: "Not on the agenda", after: "Approved and scheduled" },
    { label: "Volunteer days", before: "None planned", after: "First one next month" },
    { label: "Creek path", before: "Litter reported for 8 months", after: "Crew assigned" },
  ],
  people: [
    { name: "Dana Whitfield", role: "Riverbend Neighbors organizer (sample)" },
    { name: "Councilmember Ortiz", role: "Parks committee chair (sample)" },
  ],
  numbers: [
    { label: "People who wrote in", value: "42" },
    { label: "Minutes you gave", value: "15" },
    { label: "Weeks to a decision", value: "1" },
  ],
  next: { title: "Do it again for something else", href: "/", label: "Find my next step" },
};
