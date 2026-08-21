import type { z } from "zod";

/**
 * Provider-neutral structured output. The analysis engine only ever asks for "JSON matching
 * this schema"; which model answers is configuration (ANALYSIS_PROVIDER = claude | gemini).
 * Either way the result is validated against the same Zod schema before it is used.
 */

export class AnalysisError extends Error {}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

export interface StructuredRequest<S extends z.ZodType> {
  system: string;
  user: string;
  schema: S;
  maxTokens?: number;
}

