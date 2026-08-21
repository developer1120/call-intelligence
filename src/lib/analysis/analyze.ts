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
