import { z } from "zod";
import type { Transcript } from "@/lib/transcription/types";
import { structuredCall, type Usage } from "./llm";
import { clock } from "./prompts";

/**
 * On low-quality mono phone audio, diarization sometimes hears one voice on a two-person
 * call. Then we ask the model to attribute each line from context (who greets as the company,
 * who asks about their own home…) so the scorecard grades the right person.
 */
export function needsSpeakerRepair(t: Transcript) {
  return t.speakers.length < 2 && t.utterances.length >= 4;
}

const SYSTEM = `You label who is speaking in a machine transcript of a phone call between a pest control company employee and a caller. Speaker detection failed, so every line is shown without a speaker. For each line, decide from context who said it: "rep" (the company employee: greets with the company name, looks up accounts, schedules, quotes), "customer" (the caller/homeowner), or "other" (automated message, call screener, hold recording, third party). A line can contain a quick reply from the other person; label it by who says most of it. Return exactly one label per line, in order.`;

export async function repairSpeakers(t: Transcript): Promise<{ transcript: Transcript; usage: Usage; model: string }> {
  const schema = z.object({
    roles: z.array(z.enum(["rep", "customer", "other"])).describe(`Exactly ${t.utterances.length} labels, one per line in order`),
  });
