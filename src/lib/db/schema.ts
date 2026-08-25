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
