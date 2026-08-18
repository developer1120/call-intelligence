import type { Grade } from "@/lib/analysis/rubrics";
import type { CallType, Outcome } from "@/lib/analysis/taxonomy";
import type { CallStatus } from "@/lib/db/schema";
import { PROMISE_VERB } from "@/lib/insights";
import type { CallListItem } from "@/lib/queries";

/** The slice of a call the list UI needs (keeps transcripts and raw model output off the client). */
export interface CallRowView {
  id: string;
  label: string;
  status: CallStatus;
  stalled: boolean;
  error: string | null;
  createdAt: string;
  durationSec: number | null;
  repName: string | null;
  customerName: string | null;
  callType: CallType | null;
  outcome: Outcome | null;
  headline: string | null;
  summary: string | null;
  score: { score: number; max: number; grade: Grade } | null;
  scorecardId: string | null;
  needsReview: boolean;
  risks: number;
  highRisk: boolean;
  followUps: number;
  money: { value: number | null; direction: string | null; basis: string | null };
