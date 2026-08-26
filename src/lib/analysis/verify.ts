import type { Transcript } from "@/lib/transcription/types";
import type { EvidenceRef } from "./schemas";
import type { Evidence, SpeakerRole } from "./types";

/** Share of the quote's words that must appear, in order, in the transcript. */
const MATCH_THRESHOLD = 0.8;

export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9$%\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Longest common subsequence length of two word lists. */
function lcs(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * How well `quote` is contained in `text`, from 0 to 1. Uses an in-order word match,
 * so small transcription/punctuation differences don't fail a genuine quote, but a
 * paraphrase or invented line does.
 */
export function containment(quote: string, text: string): number {
  const q = normalizeWords(quote);
  if (!q.length) return 0;
  const t = normalizeWords(text);
  return lcs(q, t) / q.length;
}

export class EvidenceVerifier {
  private roleBySpeaker: Map<number, SpeakerRole>;
  checked = 0;
  verified = 0;

  constructor(
    private transcript: Transcript,
    speakers: { speaker: number; role: SpeakerRole }[],
  ) {
    this.roleBySpeaker = new Map(speakers.map((s) => [s.speaker, s.role]));
  }

  roleOf(u: number): SpeakerRole {
    const utt = this.transcript.utterances[u];
    return utt ? (this.roleBySpeaker.get(utt.speaker) ?? "other") : "other";
  }

  /**
