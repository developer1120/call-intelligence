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
