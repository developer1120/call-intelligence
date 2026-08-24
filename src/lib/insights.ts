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
      const objection = a.objections.find((o) => o.handling !== "resolved") ?? a.objections[0];
      out.push({
        ...base,
        key: `sales:${c.call.id}`,
        kind: "sales",
        priority: (a.money.annualValue ?? 0) >= 400 ? "high" : "medium",
        title: `Call back ${who(c)} — ${pests ? `${pests} quote` : "quote"} didn't book`,
        detail: objection
          ? `Stalled on ${objection.type.replaceAll("_", " ")}: ${objection.summary}`
          : a.outcome.headline,
        assignee: repName(c),
        value: a.money.annualValue,
        valueBasis: a.money.basis,
        evidence: objection?.evidence ?? a.outcome.evidence[0] ?? null,
      });
    }

    if (a.callType === "retention" || a.outcome.result === "cancelled") {
      if (a.outcome.result === "cancelled") {
        out.push({
          ...base,
          key: `winback:${c.call.id}`,
          kind: "winback",
          priority: "high",
          title: `Win back ${who(c)}, who cancelled`,
          detail: [
            a.details.cancellationReason ? `Reason: ${lower(a.details.cancellationReason)}.` : null,
            a.details.saveOffer ? `Offered: ${lower(a.details.saveOffer)}.` : "No save offer was made on the call.",
          ]
            .filter(Boolean)
            .join(" "),
          assignee: "Office Manager",
          value: a.money.annualValue,
          valueBasis: a.money.basis,
          evidence: a.outcome.evidence[0] ?? null,
        });
      } else if (a.money.direction === "at_risk") {
        out.push({
          ...base,
          key: `winback:${c.call.id}`,
          kind: "winback",
          priority: "high",
          title: `Finish the save with ${who(c)}`,
          detail: a.outcome.headline,
          assignee: repName(c),
          value: a.money.annualValue,
          valueBasis: a.money.basis,
          evidence: a.outcome.evidence[0] ?? null,
        });
      }
    }

    // Only commitments someone could forget reach the owner; routine visit/account notes stay on the call page.
    // (Keys keep the index among company follow-ups so they match the Assign buttons on the call page.)
    a.followUps
      .filter((f) => f.owner === "company")
      .forEach((f, i) => {
        if (!PROMISE_VERB.test(f.action)) return;
        out.push({
          ...base,
          key: `promise:${c.call.id}:${i}`,
          kind: "promise",
          priority: a.risks.some((r) => r.severity === "high") ? "high" : "medium",
          title: cap(f.action),
          detail: `Promised to ${who(c)} on ${c.call.label}${f.due ? ` · due ${f.due}` : ""}`,
          assignee: repName(c),
          value: null,
          valueBasis: null,
          evidence: f.evidence,
        });
      });

    a.risks
      .filter((r) => r.severity !== "low" && r.type !== "churn")
      .forEach((r, i) =>
        out.push({
          ...base,
          key: `risk:${c.call.id}:${i}`,
          kind: "risk",
          priority: r.severity === "high" ? "high" : "medium",
          title: `${RISK_LABEL[r.type] ?? "Risk"}: ${r.description}`,
          detail: `${CALL_TYPE_LABEL[a.callType]} call with ${who(c)}`,
          assignee: "Office Manager",
          value: null,
          valueBasis: null,
          evidence: r.evidence,
        }),
      );

    if (a.quality.needsReview) {
      out.push({
        ...base,
        key: `review:${c.call.id}`,
        kind: "review",
        priority: "low",
        title: `Double-check the AI result for ${c.call.label}`,
        detail: a.quality.reasons.join(" · "),
        assignee: "Office Manager",
        value: null,
        valueBasis: null,
        evidence: null,
      });
    }
  }

  // Coaching: each rep's most-missed step, when it's a real pattern.
  for (const rep of buildTeam(calls)) {
    const top = rep.missed[0];
    if (!top || rep.graded < 2 || top.missed / top.of < 0.5) continue;
    const latest = rep.coachingLines.find((l) => l.itemId === top.itemId);
    out.push({
      key: `coach:${rep.id}:${top.itemId}`,
      kind: "coaching",
      priority: rep.avgPct !== null && rep.avgPct < 0.8 ? "medium" : "low",
      title: `Coach ${rep.name} on “${top.label}”`,
      detail: `Missed on ${top.missed} of ${top.of} graded calls.${latest ? ` Try: “${latest.tryThis}”` : ""}`,
      assignee: "Manager",
      value: null,
      valueBasis: null,
      callId: latest?.callId ?? null,
      callLabel: latest?.callLabel ?? null,
      evidence: null,
    });
  }

  // Team-wide missed opportunity patterns.
  const opp = new Map<string, { missed: number; of: number }>();
  for (const c of calls) {
    for (const o of c.analysis.opportunities) {
      const s = opp.get(o.type) ?? { missed: 0, of: 0 };
      s.of++;
      if (!o.captured) s.missed++;
      opp.set(o.type, s);
    }
  }
  for (const [type, s] of opp) {
    if (s.missed < 2) continue;
    out.push({
      key: `pattern:${type}`,
      kind: "pattern",
      priority: s.missed >= 4 ? "medium" : "low",
      title: `${OPPORTUNITY_LABEL[type] ?? type} missed on ${s.missed} of ${s.of} calls where it fit`,
      detail: "Make it part of next team meeting's call review.",
      assignee: "Manager",
      value: null,
      valueBasis: null,
      callId: null,
      callLabel: null,
      evidence: null,
    });
  }

  return out
    .map((i) => ({ ...i, task: taskByKey.get(i.key) ?? null }))
    .sort(
      (x, y) =>
        Number(x.task?.status === "done") - Number(y.task?.status === "done") ||
        PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority] ||
        (y.value ?? 0) - (x.value ?? 0),
    );
