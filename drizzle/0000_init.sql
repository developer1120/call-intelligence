CREATE TABLE "analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"call_id" text NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"call_type" text NOT NULL,
	"scorecard_id" text,
	"score" integer,
	"max_score" integer,
	"grade" text,
	"outcome" text NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"data" jsonb NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calls" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"source_filename" text NOT NULL,
	"audio_key" text NOT NULL,
	"audio_mime" text DEFAULT 'audio/mpeg' NOT NULL,
	"audio_bytes" integer DEFAULT 0 NOT NULL,
	"duration_sec" real,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text,
	"rep_id" text,
	"direction" text DEFAULT 'unknown' NOT NULL,
	"occurred_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stage_started_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"transcript_source" text
);
--> statement-breakpoint
CREATE TABLE "overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"call_id" text NOT NULL,
	"field" text NOT NULL,
	"value" text NOT NULL,
