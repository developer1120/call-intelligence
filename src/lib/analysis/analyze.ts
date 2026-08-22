import type { Transcript } from "@/lib/transcription/types";
import { structuredCall, type Usage } from "./llm";
import { PROMPT_VERSION, SCORING_SYSTEM, TRIAGE_SYSTEM, scoringUserMessage, triageUserMessage } from "./prompts";
import { SCORECARDS, gradeFor, type Scorecard } from "./rubrics";
import { TriageSchema, scoringSchemaFor, type ScoringResult, type Triage } from "./schemas";
import { scorecardFor, type CallType, type Outcome } from "./taxonomy";
import { needsSpeakerRepair, repairSpeakers } from "./speakers";
import type { CallAnalysis, Money, ScoredItem, ScorecardResult } from "./types";
import { EvidenceVerifier } from "./verify";

export interface Overrides {
  callType?: CallType;
  /** itemId -> true (award the point) / false (withhold it) */
  items?: Record<string, boolean>;
}

const OBJECTION_ITEMS = new Set(["obj_agree", "obj_restate", "obj_resolve", "obj_reclose"]);

/** Typical first-year value of a residential pest customer, used only when no price is said on the call. */
const DEFAULT_ANNUAL_VALUE = Number(process.env.DEFAULT_ANNUAL_VALUE ?? 650);

/**
 * Full analysis of one call: (repair speakers if needed) → classify + extract → score + coach
 * against the right scorecard. Returns the transcript too, since speaker repair may change it.
 */
export async function analyzeTranscript(
  input: Transcript,
  overrides: Overrides = {},
  cached?: { triage?: Triage; scoring?: ScoringResult | null },
): Promise<{ analysis: CallAnalysis; transcript: Transcript }> {
  const usage: Usage = { inputTokens: 0, outputTokens: 0, durationMs: 0 };
  let model = "";

  let transcript = input;
  if (!cached?.triage && needsSpeakerRepair(transcript)) {
    const res = await repairSpeakers(transcript);
    transcript = res.transcript;
    add(usage, res.usage);
  }

  let triage = cached?.triage;
  if (!triage) {
    if (transcript.utterances.length === 0) {
      triage = emptyTriage();
    } else {
      const res = await structuredCall({
        system: TRIAGE_SYSTEM,
        user: triageUserMessage(transcript),
        schema: TriageSchema,
      });
      triage = res.data;
      model = res.model;
      add(usage, res.usage);
    }
  }
  if (overrides.callType && overrides.callType !== triage.callType) {
    triage = { ...triage, callType: overrides.callType };
  }

  const scorecardId = scorecardFor(triage.callType);
  const card = scorecardId ? SCORECARDS[scorecardId] : null;

  let scoring: ScoringResult | null = null;
  if (card) {
    const reuse = cached?.scoring && Object.keys(cached.scoring.items).every((id) => card.items.some((i) => i.id === id));
    if (reuse) {
      scoring = cached!.scoring!;
    } else {
      const res = await structuredCall({
        system: SCORING_SYSTEM,
        user: scoringUserMessage(transcript, triage, card),
        schema: scoringSchemaFor(card.id),
      });
      scoring = res.data as ScoringResult;
      model = res.model;
      add(usage, res.usage);
    }
  }

  const analysis = assemble(transcript, triage, card, scoring, overrides, usage, model);
  return { analysis, transcript };
}

export function assemble(
  transcript: Transcript,
  triage: Triage,
  card: Scorecard | null,
  scoring: ScoringResult | null,
  overrides: Overrides,
  usage: Usage,
  model: string,
): CallAnalysis {
  const v = new EvidenceVerifier(transcript, triage.speakers);
  const reasons: string[] = [];

  const callTypeEvidence = v.locateAll(triage.callTypeEvidence);
  const outcomeEvidence = v.locateAll(triage.outcome.evidence);

  let scorecard: ScorecardResult | null = null;
  if (card && scoring) {
    const items: ScoredItem[] = card.items.map((rubric) => {
      const j = scoring.items[rubric.id] ?? { status: "missed" as const, reasoning: "Not assessed.", evidence: [] };
      const evidence = v.locateAll(j.evidence);
      let status = j.status;
      let credited = false;
      let creditNote: string | null = null;

      if (OBJECTION_ITEMS.has(rubric.id) && triage.objections.length === 0) {
        // Sales manual: no objections means the rep automatically gets the 4 objection points.
        status = "not_needed";
        credited = true;
        creditNote = rubric.creditWhenNotNeeded ?? null;
      } else if (status === "not_needed") {
        const contradiction =
          (OBJECTION_ITEMS.has(rubric.id) && triage.objections.length > 0) ||
          (rubric.id === "ret_teaser" && triage.outcome.result === "cancelled");
        if (contradiction || !rubric.creditWhenNotNeeded) {
          status = "missed";
          creditNote = "This step was required on this call.";
        } else {
