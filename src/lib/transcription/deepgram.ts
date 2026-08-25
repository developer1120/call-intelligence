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
