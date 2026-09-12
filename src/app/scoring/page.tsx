import type { Metadata } from "next";
import {
  AudioLines,
  CircleCheck,
  CircleMinus,
  FileSearch,
  ListChecks,
  LockKeyhole,
  Quote,
  ScanSearch,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { Card, CardHeader, Page, PageHeader, SectionTitle } from "@/components/ui";
import { SCORECARDS } from "@/lib/analysis/rubrics";
import { cn } from "@/lib/utils";
import summary from "../../../data/eval/summary.json";

export const metadata: Metadata = { title: "How scoring works" };

const STEPS = [
  {
    icon: AudioLines,
    title: "Transcribe",
    body: "Deepgram Nova-3 separates the rep from the customer and timestamps every word. Card numbers are removed, including when a rep reads them back.",
  },
  {
    icon: LockKeyhole,
    title: "Protect customers",
    body: "Names, phone numbers, emails and street addresses are masked before anything is stored or sent to an AI model. Your team's names are kept.",
  },
  {
    icon: ScanSearch,
    title: "Understand the call",
    body: "The AI decides what kind of call it was, how it ended, and pulls out pests, prices, objections, promised follow-ups and risks.",
  },
  {
    icon: ListChecks,
    title: "Score against your scorecard",
    body: "Each step of the right scorecard is judged on its own, with the rep's exact words as evidence, and coaching is written in your manual's style.",
  },
  {
    icon: ShieldCheck,
    title: "Check the work",
    body: "Software matches every quoted line back to the transcript and applies the manual's point rules. Anything uncertain is flagged for a quick human check.",
  },
];

const POLICIES = [
  {
    icon: Quote,
    title: "Evidence or no point",
    body: "A step only earns its point when the rep's line is found in the transcript. If the AI says a step happened but its quote can't be matched, the point is withheld and the call is flagged.",
  },
  {
    icon: CircleMinus,
    title: "The manual's own credit rules",
    body: "If a sales customer raises no objection, the 4 objection points are awarded (Sales Call Manual). On retention calls, “Repeat” is credited when the first offer is accepted and the “teaser” when the customer is saved. These are enforced in code, not left to the AI.",
  },
  {
    icon: FileSearch,
    title: "The right scorecard for the call",
    body: "New-customer calls use the 17-point Sales scorecard, cancellations use the 12-point Retention scorecard, everything else uses the 12-point All Calls scorecard. Voicemails, wrong numbers and dropped calls aren't graded.",
  },
  {
    icon: UserRoundCog,
    title: "Managers have the last word",
    body: "Change the call type or award/remove any step from the call page. The score re-totals immediately and the correction is kept if the call is re-analyzed.",
  },
];

function pct(x: { ok: number; of: number }) {
  return x.of ? Math.round((x.ok / x.of) * 100) : 0;
}

