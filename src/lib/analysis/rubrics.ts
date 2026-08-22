/**
 * PestLaunch call scorecards, transcribed from the company's Office Call Manual
 * (All Calls + Retention scorecards) and Sales Call Manual (Sales scorecard).
 *
 * Point totals, grade bands and the "auto-award" rules live here, in code, so the
 * AI never decides how many points a call is worth: it only judges each step,
 * with evidence, and the score is computed from those judgements.
 */

export type ScorecardId = "sales" | "service" | "retention";
export type Quadrant = "Validate" | "Understand" | "Solve" | "Overcome Objections" | "Verify";

export interface RubricItem {
  id: string;
  quadrant: Quadrant;
  label: string;
  /** What the rep has to do to earn the point. Shown to the AI and in the UI. */
  standard: string;
  /** An example line from the manual. */
  example: string;
  /**
   * When the step was not needed on this call, the manual awards the point anyway.
   * The AI may only return "not_needed" for items that have this set.
   */
  creditWhenNotNeeded?: string;
}

export interface Scorecard {
  id: ScorecardId;
  name: string;
  source: string;
  items: RubricItem[];
  bands: { gold: number; green: number };
}

const validate: RubricItem = {
  id: "validate",
  quadrant: "Validate",
  label: "Validate",
  standard:
    "Right after the greeting, validate the caller's reason for calling with SPECIFIC details of their situation and genuine empathy (side with them). Vague, generic lines (\"okay\", \"sure\", \"no problem\") do not count.",
  example: "I am so sorry to hear about your ant activity in your kitchen. If that was my kitchen, I would absolutely be going crazy.",
};

const confidence: RubricItem = {
  id: "confidence",
  quadrant: "Validate",
  label: "Confidence statement",
  standard:
    "Clearly and enthusiastically tell the customer you can help and are on their team, putting them at ease and taking control of the call.",
  example: "I am glad you called in today about those ants, I can definitely take care of this for you.",
};

const expectation1: RubricItem = {
  id: "expectation_1",
  quadrant: "Validate",
  label: "Expectation statement (before questions)",
  standard:
    "Before investigating, tell the customer what happens next (e.g. that you will ask a few questions and why), so they know the roadmap.",
  example: "I'm just going to ask you a few questions about that ant activity, so I can make sure we get you the quote you are looking for.",
};

const investigate: RubricItem = {
  id: "investigate",
  quadrant: "Understand",
  label: "Investigate",
  standard:
    "Ask mainly open-ended questions (who/what/when/where/why/how) to understand the situation and root cause (what they're seeing, where, how long, what they've tried). Met when the rep genuinely investigates; surfacing at least 3 WINs (wants, interests, needs) is the gold standard, so note it in the reasoning when fewer were found rather than failing the step. On simple scheduling/billing calls a focused clarifying question about the specifics counts.",
  example: "When did you start seeing ants in the kitchen?",
};

const summary: RubricItem = {
  id: "summary",
  quadrant: "Understand",
  label: "Summary statement",
  standard:
