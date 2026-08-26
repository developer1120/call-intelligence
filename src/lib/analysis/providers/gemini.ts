import { ApiError, GoogleGenAI, ThinkingLevel, type GenerateContentConfig } from "@google/genai";
import { z } from "zod";
import { AnalysisError, type StructuredRequest, type StructuredResult } from "../llm";

let client: GoogleGenAI | undefined;
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new AnalysisError("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

/**
 * GEMINI_MODEL may list fallbacks, e.g. "gemini-3-flash-preview,gemini-3.5-flash-lite":
 * when a model is overloaded (503) the request moves to the next one instead of failing.
 */
function geminiModels(): string[] {
  const list = (process.env.GEMINI_MODEL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length) throw new AnalysisError("GEMINI_MODEL is not set (copy the exact model ID from Google AI Studio)");
  return list;
}

/** Zod → the JSON Schema subset Gemini accepts (no $schema keyword). */
function toGeminiSchema(schema: z.ZodType): unknown {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

/** Some Gemini models take a thinking level, older ones don't; we fall back if it's rejected. */
let thinkingSupported = true;

/**
 * Request pacing. Free-tier keys allow only a few requests per minute per model, so requests
 * are spaced by 60s / GEMINI_RPM (default 5). Paid keys can raise GEMINI_RPM.
 */
const g = globalThis as unknown as { __geminiNext?: number };
async function pace() {
  const rpm = Math.max(1, Number(process.env.GEMINI_RPM ?? 5));
  const interval = Math.ceil(60_000 / rpm) + 250;
  const now = Date.now();
  const at = Math.max(now, g.__geminiNext ?? 0);
  g.__geminiNext = at + interval;
  if (at > now) await sleep(at - now);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Seconds Google asks us to wait, from "Please retry in 49.01s" in a 429. */
function retryAfterMs(message: string): number | null {
  const m = /retry in ([\d.]+)s/i.exec(message);
  return m ? Math.ceil(Number(m[1]) * 1000) + 1000 : null;
}

/**
 * One Gemini structured-output request. Gemini constrains output to the JSON schema; we
 * still parse it with the same Zod schema so both providers are held to one contract.
 */
export async function geminiStructured<S extends z.ZodType>(req: StructuredRequest<S>): Promise<StructuredResult<z.infer<S>>> {
  const started = Date.now();
  const models = geminiModels();
  let modelIndex = 0;
  let overloadedTries = 0;
  const baseConfig: GenerateContentConfig = {
    systemInstruction: req.system,
    responseMimeType: "application/json",
    responseJsonSchema: toGeminiSchema(req.schema),
    maxOutputTokens: req.maxTokens ?? 32000,
  };

  let lastError: unknown;
  const MAX_ATTEMPTS = 8;
