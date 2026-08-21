import type { Transcript } from "@/lib/transcription/types";
import type { Scorecard } from "./rubrics";
import type { Triage } from "./schemas";
import {
  CALL_TYPE_DEFINITIONS,
  CALL_TYPE_LABEL,
  CALL_TYPES,
  OUTCOME_DEFINITIONS,
  OUTCOMES,
} from "./taxonomy";

/** Bump when prompts or rubric wording change, so stored analyses can be compared. */
export const PROMPT_VERSION = "2026-10-20.6";

export function clock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Transcript as the model sees it. Utterance indexes are how it cites evidence. */
export function renderTranscript(t: Transcript, speakers?: Triage["speakers"]): string {
  const label = new Map<number, string>();
  for (const s of speakers ?? []) {
    const role = s.role === "rep" ? "REP" : s.role === "customer" ? "CUSTOMER" : "OTHER";
    label.set(s.speaker, s.name ? `${role} (${s.name})` : role);
  }
  return t.utterances
    .map((u) => `[u${u.i} ${clock(u.start)}] ${label.get(u.speaker) ?? `S${u.speaker}`}: ${u.text}`)
    .join("\n");
}

const EVIDENCE_RULES = `
Evidence rules (these are checked by software against the transcript, and unverifiable claims are thrown out):
- Every evidence item is {u, quote}: u is the utterance index shown as [u12 …], quote is words copied EXACTLY from that utterance. Never paraphrase, merge distant lines, or fix grammar.
