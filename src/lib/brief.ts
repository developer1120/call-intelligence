import { buildTeam, stepRates, type AnalyzedCall, type Insight } from "@/lib/insights";
import { formatMoney } from "@/lib/utils";

export interface BriefLine {
  tone: "good" | "bad" | "neutral";
  text: string;
  href?: string;
}

/**
 * The owner's three-line read of the period, written from the numbers (not by the AI),
 * so every sentence is traceable to calls in the list.
 */
export function buildBrief(calls: AnalyzedCall[], insights: Insight[]): BriefLine[] {
  const lines: BriefLine[] = [];
  const sales = calls.filter((c) => c.analysis.callType === "new_customer");
  if (sales.length) {
    const booked = sales.filter((c) => c.analysis.outcome.result === "booked");
    const open = sales.filter((c) => c.analysis.money.direction === "lost" || c.analysis.money.direction === "at_risk");
    const openValue = open.reduce((s, c) => s + (c.analysis.money.annualValue ?? 0), 0);
    lines.push({
      tone: open.length > booked.length ? "bad" : "good",
      text:
        `Booked ${booked.length} of ${sales.length} new-customer calls` +
        (open.length
          ? `. ${open.length} didn't book — about ${formatMoney(openValue)}/yr is still winnable with a same-day callback.`
