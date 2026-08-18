import type { Grade, Quadrant, ScorecardId } from "./rubrics";
import type { ScoringResult, Triage } from "./schemas";
import type { CallType, Outcome } from "./taxonomy";

export type SpeakerRole = "rep" | "customer" | "other";

/** Evidence after it has been checked against the transcript. */
export interface Evidence {
  u: number;
  quote: string;
  start: number;
  end: number;
  role: SpeakerRole;
  /** True when the quote was found in the transcript (fuzzy, punctuation-insensitive). */
  verified: boolean;
}

export type ItemStatus = "met" | "missed" | "not_needed";

export interface ScoredItem {
  id: string;
  quadrant: Quadrant;
  label: string;
  standard: string;
  example: string;
  status: ItemStatus;
  /** Whether the point is awarded after evidence checks, auto-credit rules and manager overrides. */
