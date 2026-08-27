import { DeepgramClient, DeepgramError } from "@deepgram/sdk";
import { employeeNames, maskUtterance, piiSpans, type DgEntity } from "./pii";
import type { Transcript, Utterance } from "./types";

/** Customer contact details are masked unless MASK_CONTACT_DETAILS=off. */
export function maskPii() {
  return process.env.MASK_CONTACT_DETAILS?.trim().toLowerCase() !== "off";
}

export const TRANSCRIPTION_MODEL = "nova-3";

/** Vocabulary the model should not mishear on pest control calls. */
const KEY_TERMS = [
  "pest control",
  "re-service",
  "quarterly",
  "initial service",
  "scorpions",
  "German cockroaches",
  "termites",
  "rodents",
  "mosquito",
  "wasps",
  "earwigs",
  "silverfish",
  "bed bugs",
  "eaves",
  "cobwebs",
  "exclusion",
  "Bug Bully",
  "Endeavor Pest Management",
  "Noble Pest",
];

const PCI_TOKEN = /\[(CREDIT_CARD|CVV)[^\]]*\]/;

/**
 * Deepgram redacts the card details the customer says, but reps often read them back
 * ("And the three digit code?" … "950."). Mask short numeric read-backs that follow a
 * redacted card detail so they never reach storage or the AI.
 */
export function redactReadback(utterances: Utterance[]): Utterance[] {
  let window = 0;
  return utterances.map((u) => {
    if (PCI_TOKEN.test(u.text)) {
      window = 4;
      return u;
    }
    if (window > 0) {
      window--;
      const words = u.text.split(/\s+/).length;
      if (words <= 8 && /\b\d{3,4}\b/.test(u.text)) {
        return { ...u, text: u.text.replace(/\b\d{3,4}\b/g, "[REDACTED]") };
      }
    }
    return u;
  });
}

export class TranscriptionError extends Error {}

/**
 * @param roster employee first names (reps and technicians) that are never masked; in PestLaunch
 * this comes from the team list synced from the CRM.
 */
export async function transcribeAudio(audio: Buffer, mime: string, roster: string[] = []): Promise<Transcript> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new TranscriptionError("DEEPGRAM_API_KEY is not set");

  const client = new DeepgramClient({ apiKey });
