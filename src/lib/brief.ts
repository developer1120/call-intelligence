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
          : "."),
      href: "/calls?view=sales",
    });
  }

  const retention = calls.filter((c) => c.analysis.callType === "retention");
  if (retention.length) {
    const saved = retention.filter((c) => c.analysis.outcome.result === "saved");
    const lost = retention.filter((c) => c.analysis.outcome.result === "cancelled");
    const noOffer = lost.filter((c) => !c.analysis.details.saveOffer);
    lines.push({
      tone: saved.length >= lost.length ? "good" : "bad",
      text:
        `Saved ${saved.length} of ${retention.length} customers who called to cancel` +
        (noOffer.length ? `; ${noOffer.length} cancelled without being offered a save option.` : "."),
      href: "/calls?view=retention",
    });
  }

  const graded = calls.filter((c) => c.analysis.scorecard);

  // Referrals + "one-stop shop" are free revenue the Sales Manual asks for on every sales call.
  const finalInfo = stepRates(graded, "sales").find((s) => s.itemId === "final_info");
  const referralGap = finalInfo && finalInfo.of >= 3 && finalInfo.met / finalInfo.of < 0.5 ? finalInfo : null;
  if (referralGap) {
    lines.push({
