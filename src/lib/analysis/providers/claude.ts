import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { AnalysisError, type StructuredRequest, type StructuredResult } from "../llm";

export const DEFAULT_CLAUDE_MODEL = "claude-opus-5-5";

let client: Anthropic | undefined;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AnalysisError("ANTHROPIC_API_KEY is not set");
  client ??= new Anthropic({ maxRetries: 3, timeout: 10 * 60 * 1000 });
  return client;
}

/**
 * One Claude structured-output request. The SDK validates the response against the schema;
 * a malformed or truncated response is retried once.
 */
export async function claudeStructured<S extends z.ZodType>(req: StructuredRequest<S>): Promise<StructuredResult<z.infer<S>>> {
  const started = Date.now();
  const model = process.env.ANALYSIS_MODEL?.trim() || DEFAULT_CLAUDE_MODEL;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await getClient().beta.messages.parse({
        model,
        max_tokens: req.maxTokens ?? 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
