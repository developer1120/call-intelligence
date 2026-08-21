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
  return (
    (c.status === "queued" || c.status === "transcribing" || c.status === "analyzing") &&
    !!c.stageStartedAt &&
    Date.now() - c.stageStartedAt.getTime() > STALL_MS
  );
}

/** Every call with its current analysis, newest first. Filtering happens in the UI (small data). */
export async function listCalls(): Promise<CallListItem[]> {
  const db = await getDb();
  const rows = await db
    .select({ call: calls, rep: reps, analysis: analyses.data })
    .from(calls)
    .leftJoin(reps, eq(calls.repId, reps.id))
    .leftJoin(analyses, and(eq(analyses.callId, calls.id), eq(analyses.isCurrent, true)))
    .orderBy(desc(calls.createdAt), desc(calls.label));
  return rows.map((r) => ({ call: r.call, rep: r.rep, analysis: current(r.analysis), stalled: isStalled(r.call) }));
}

export async function completedCalls() {
  const all = await listCalls();
  return all.filter((c): c is CallListItem & { analysis: CallAnalysis } => c.analysis !== null);
}

