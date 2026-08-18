import { and, desc, eq } from "drizzle-orm";
import { withCurrentRubric } from "@/lib/analysis/rubrics";
import type { CallAnalysis } from "@/lib/analysis/types";
import { getDb, schema } from "@/lib/db";
import type { CallRow, RepRow, TaskRow } from "@/lib/db/schema";
import { STALL_MS } from "@/lib/pipeline";
import type { Transcript } from "@/lib/transcription/types";

const { calls, analyses, reps, transcripts, tasks, overrides } = schema;

/** Stored analysis with step names/standards from the current rubric. */
function current(a: CallAnalysis | null | undefined): CallAnalysis | null {
  return a ? { ...a, scorecard: withCurrentRubric(a.scorecard) } : null;
}

export interface CallListItem {
  call: CallRow;
  rep: RepRow | null;
  analysis: CallAnalysis | null;
  stalled: boolean;
}

function isStalled(c: CallRow) {
