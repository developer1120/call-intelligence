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
  credited: boolean;
  /** Why the point was (not) awarded when it differs from the AI's raw call. */
  creditNote: string | null;
  reasoning: string;
  evidence: Evidence[];
  overridden: boolean;
}

export interface ScorecardResult {
  id: ScorecardId;
  name: string;
  source: string;
  items: ScoredItem[];
  score: number;
  max: number;
  grade: Grade;
  bands: { gold: number; green: number };
}

export interface Coaching {
  headline: string;
  strengths: { title: string; detail: string; evidence: Evidence | null }[];
  improvements: {
    itemId: string | null;
    title: string;
    whatHappened: string;
    impact: string;
