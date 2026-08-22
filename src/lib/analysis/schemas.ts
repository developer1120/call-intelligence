import { z } from "zod";
import { SCORECARDS, type ScorecardId } from "./rubrics";
import { CALL_TYPES, NOT_SCOREABLE_REASONS, OUTCOMES } from "./taxonomy";

/** A pointer into the transcript. Times are looked up from the utterance, never trusted from the model. */
export const EvidenceSchema = z.object({
  u: z.number().int().describe("Utterance index, the number after 'u' in the transcript line"),
  quote: z.string().describe("Exact words copied from that utterance (max ~25 words). Never paraphrase."),
});
export type EvidenceRef = z.infer<typeof EvidenceSchema>;

const Confidence = z.enum(["high", "medium", "low"]);

export const TriageSchema = z.object({
  speakers: z
    .array(
      z.object({
        speaker: z.number().int(),
        role: z.enum(["rep", "customer", "other"]),
        name: z.string().nullable(),
      }),
    )
    .describe("Every speaker number in the transcript and who they are. 'other' = IVR, hold message, technician, 3rd party."),
  repName: z.string().nullable().describe("The company employee's first name as said on the call, else null"),
  customerName: z.string().nullable(),
  companyName: z.string().nullable().describe("The pest control company the rep works for, as said on the call"),
  direction: z.enum(["inbound", "outbound", "unknown"]),
  callType: z.enum(CALL_TYPES),
  callTypeConfidence: Confidence,
  callTypeReason: z.string().describe("One sentence on why this type, citing what was said"),
  callTypeEvidence: z.array(EvidenceSchema),
  notScoreableReason: z.enum(NOT_SCOREABLE_REASONS),
