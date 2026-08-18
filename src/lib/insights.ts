/**
 * Turns individual call analyses into decisions for the owner: what needs action now,
 * who needs coaching on what, and where calls are breaking down across the team.
 * Everything here is deterministic arithmetic over the stored analyses.
 */
import { SCORECARDS, type Quadrant, type ScorecardId } from "@/lib/analysis/rubrics";
import { CALL_TYPE_LABEL } from "@/lib/analysis/taxonomy";
import type { CallAnalysis, Evidence } from "@/lib/analysis/types";
import type { CallRow, RepRow, TaskRow } from "@/lib/db/schema";

export interface AnalyzedCall {
  call: CallRow;
  rep: RepRow | null;
  analysis: CallAnalysis;
}

export type Priority = "high" | "medium" | "low";
export type InsightKind = "sales" | "winback" | "promise" | "risk" | "coaching" | "pattern" | "review";

export interface Insight {
  key: string;
  kind: InsightKind;
  priority: Priority;
  title: string;
  detail: string;
  /** Suggested owner of the task. */
  assignee: string;
  value: number | null;
  valueBasis: "quoted" | "estimated" | null;
  callId: string | null;
  callLabel: string | null;
  evidence: Evidence | null;
  task: TaskRow | null;
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Follow-ups that someone has to actively do and can forget (vs. routine notes on the account). */
export const PROMISE_VERB =
  /\b(call (the )?(customer|them|her|him|back)|call back|callback|reach (back )?out|speak (with|to)|talk (to|with)|check with|let .{1,30} know|follow up with|send (over )?(the |a )?(service agreement|agreement|quote|estimate|invoice|preparation|prep|info|information|link|pricing|proof)|waive|refund|credit (the|their|back)|look into|move .{1,30} (up|sooner)|earlier (slot|availability|opening|appointment))/i;

const RISK_LABEL: Record<string, string> = {
  churn: "Churn risk",
  complaint: "Complaint",
  technician_issue: "Technician issue",
  billing_dispute: "Billing dispute",
  damage_claim: "Damage claim",
  safety_concern: "Safety concern",
  bad_review_threat: "Bad review threat",
  escalation: "Escalation requested",
};

const OPPORTUNITY_LABEL: Record<string, string> = {
  upsell: "Upsell",
  cross_sell: "Add-on service",
  referral: "Referral ask",
  review: "Review request",
  booking: "Booking",
  save: "Save",
  prepay: "Annual prepay",
};

function who(c: AnalyzedCall) {
  return c.analysis.customerName ?? "the caller";
}
function repName(c: AnalyzedCall) {
  return c.rep?.name ?? c.analysis.repName ?? "Office team";
}

export function buildInsights(calls: AnalyzedCall[], tasks: TaskRow[]): Insight[] {
  const taskByKey = new Map(tasks.map((t) => [t.sourceKey, t]));
  const out: Omit<Insight, "task">[] = [];

  for (const c of calls) {
    const a = c.analysis;
    const base = { callId: c.call.id, callLabel: c.call.label };
    const pests = a.details.pests.length ? a.details.pests.join(", ") : null;

    if (a.callType === "new_customer" && (a.money.direction === "lost" || a.money.direction === "at_risk")) {
