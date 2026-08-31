import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { CallAnalysis } from "@/lib/analysis/types";
import type { Transcript } from "@/lib/transcription/types";

export const reps = pgTable("reps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** "office" (CSR) or "sales"; inferred from the calls they take. */
  role: text("role").notNull().default("office"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CallStatus = "queued" | "transcribing" | "analyzing" | "complete" | "failed";

export const calls = pgTable(
  "calls",
  {
    id: text("id").primaryKey(),
    /** Human label such as "CALL-007" or the uploaded file name. */
    label: text("label").notNull(),
    sourceFilename: text("source_filename").notNull(),
    audioKey: text("audio_key").notNull(),
    audioMime: text("audio_mime").notNull().default("audio/mpeg"),
    audioBytes: integer("audio_bytes").notNull().default(0),
    durationSec: real("duration_sec"),
    status: text("status").$type<CallStatus>().notNull().default("queued"),
    error: text("error"),
    repId: text("rep_id").references(() => reps.id, { onDelete: "set null" }),
    direction: text("direction").$type<"inbound" | "outbound" | "unknown">().notNull().default("unknown"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** When the current processing stage started; used to detect stalled jobs. */
    stageStartedAt: timestamp("stage_started_at", { withTimezone: true }),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    /** Where the transcript came from on the last run ("deepgram" or "cache" for pre-transcribed seed calls). */
    transcriptSource: text("transcript_source"),
  },
  (t) => [index("calls_created_idx").on(t.createdAt), index("calls_rep_idx").on(t.repId)],
);

export const transcripts = pgTable("transcripts", {
  callId: text("call_id")
    .primaryKey()
    .references(() => calls.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  data: jsonb("data").$type<Transcript>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyses = pgTable(
  "analyses",
  {
    id: text("id").primaryKey(),
    callId: text("call_id")
