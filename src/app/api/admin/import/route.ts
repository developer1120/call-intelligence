import type { CallAnalysis } from "@/lib/analysis/types";
import { importAnalyzedCall } from "@/lib/pipeline";
import type { Transcript } from "@/lib/transcription/types";

export const maxDuration = 60;

/**
 * Seeds a pre-analyzed call (used by `npm run seed`). Requires ADMIN_TOKEN in production;
 * open in local development.
 * - JSON { filename, audioUrl, bytes, transcript, analysis }: audio already uploaded to Blob
 *   storage by the seed script (production, where request bodies are limited to 4.5 MB).
 * - multipart with file + transcript + analysis: local development.
 */
export async function POST(request: Request) {
  const token = process.env.ADMIN_TOKEN;
  if (process.env.NODE_ENV === "production" && (!token || request.headers.get("x-admin-token") !== token)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  if ((request.headers.get("content-type") ?? "").includes("application/json")) {
    const body = (await request.json()) as {
      filename: string;
      audioUrl: string;
      bytes: number;
      transcript: Transcript;
      analysis: CallAnalysis;
    };
