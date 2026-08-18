import fs from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { analyzeTranscript, type Overrides } from "@/lib/analysis/analyze";
import { CALL_TYPES, type CallType } from "@/lib/analysis/taxonomy";
import type { CallAnalysis } from "@/lib/analysis/types";
import { getDb, schema } from "@/lib/db";
import type { CallStatus } from "@/lib/db/schema";
import { getRoster } from "@/lib/roster";
import { readAudio, saveAudio } from "@/lib/storage";
import { transcribeAudio } from "@/lib/transcription/deepgram";
import type { Transcript } from "@/lib/transcription/types";

const { calls, transcripts, analyses, reps, overrides } = schema;
export const newId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

/** A stage that hasn't progressed in this long is treated as failed (e.g. the server restarted mid-job). */
export const STALL_MS = 15 * 60 * 1000;

const AUDIO_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".ogg": "audio/ogg",
  ".webm": "audio/webm",
  ".flac": "audio/flac",
};

export function mimeFor(filename: string, fallback?: string) {
  return AUDIO_MIME[path.extname(filename).toLowerCase()] ?? fallback ?? "application/octet-stream";
}

/** "CALL 007.mp3" -> "CALL-007"; anything else keeps its file name. */
export function labelFor(filename: string) {
  const base = path.basename(filename, path.extname(filename)).trim();
  const m = /^call[\s_-]*(\d+)$/i.exec(base);
  return m ? `CALL-${m[1].padStart(3, "0")}` : base;
}

/** Register a recording. Pass `data` to store it, or `storedKey` when it is already in Blob storage. */
export async function createCall(
  input: { filename: string; mime?: string } & ({ data: Buffer } | { storedKey: string; bytes: number }),
) {
  const db = await getDb();
  const id = newId();
  const mime = mimeFor(input.filename, input.mime);
  const audioKey =
    "data" in input
      ? await saveAudio(`${id}${path.extname(input.filename).toLowerCase() || ".mp3"}`, input.data, mime)
      : input.storedKey;
  await db.insert(calls).values({
    id,
