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
    "Repeat the customer's situation / WINs back to them and get agreement (\"does that sound right?\"). A short confirmation of the specifics counts on simple scheduling/billing calls.",
  example:
    "From what we've discussed so far, it sounds like you are looking for an affordable and thorough solution for the ant and spider activity, that is also people and pet-friendly. Does that sound right?",
};

const expectation2: RubricItem = {
  id: "expectation_2",
  quadrant: "Understand",
  label: "Expectation statement (before solution)",
  standard:
    "Before presenting the solution, prime the customer for what comes next (e.g. walking through the service, then price, then scheduling).",
  example:
    "I'm going to walk you through our service from start to finish… I'll check in with you at the end to see if you have any questions before we talk about the price.",
};

const presentSolution: RubricItem = {
  id: "present_solution",
  quadrant: "Solve",
  label: "Present solution",
  standard:
    "Paint a picture of the solution tailored to this customer: WHAT will be done, HOW it is done and WHY it matters for their situation, in chronological order. Just stating an outcome (\"you're all set\") is a weak solution unless the call is a simple scheduling/billing change.",
  example:
    "Your technician will power treat the entire foundation of your home. This is a protective layer that will flush out the cracks and crevices, and protect your home from any pests trying to come inside.",
};

const consensus: RubricItem = {
  id: "consensus",
  quadrant: "Solve",
  label: "Consensus",
  standard: "Check that the customer agrees with / understands the solution before moving on (buy-in).",
  example: "That's our service in a nutshell. Do you have any questions about anything I just covered, before we talk about the price?",
};

const close: RubricItem = {
  id: "close",
  quadrant: "Solve",
  label: "Close",
  standard:
    "Ask for the commitment: get it scheduled / confirmed, ideally with an option close (\"morning or afternoon?\"). Per the manual, when the solution has no cost (e.g. a re-service), a successful consensus that locks in the next step is the close.",
  example: "I'm assuming you'd like to get this started as soon as possible. Which time of day usually works better for you: morning or afternoon?",
};

const conclusion: RubricItem = {
  id: "conclusion",
  quadrant: "Verify",
  label: "Provide a conclusion",
  standard:
    "Wrap up loose ends and set expectations going forward: confirm details such as name, address, email, date/time, notes for the technician, pets, gate codes.",
  example: "Perfect. You'll get a reminder text a couple days before we come out for you.",
};

const thank: RubricItem = {
  id: "thank",
  quadrant: "Verify",
  label: "Thank the customer",
  standard: "Genuinely thank the customer at the end of the call (a rushed \"thanks, bye\" is weak but counts).",
  example:
    "One last thing John, I just want to thank you for calling in and working with me today. As a local family-owned company, business from customers like you makes all the difference.",
};

const finalInfoService: RubricItem = {
  id: "final_info",
  quadrant: "Verify",
  label: "Offer final information",
  standard:
    "Offer final information: invite them to call first for any other pest need (one-stop shop) or give the useful next-step info for this call (what to expect, reminders, how to reach us).",
  example: "Don't hesitate to reach back out if you need anything. It's common for it to take a couple treatments before those ants really start going away.",
};

const finalInfoSales: RubricItem = {
  id: "final_info",
  quadrant: "Verify",
  label: "Offer final information",
  standard:
    "Position the company as the one-stop shop for ALL pest needs (termites, rodents, mosquitoes…) AND mention the referral program.",
  example:
