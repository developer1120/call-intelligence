import { describe, expect, it } from "vitest";
import type { Transcript } from "@/lib/transcription/types";
import { assemble, moneyFor } from "./analyze";
import { SCORECARDS, gradeFor } from "./rubrics";
import type { ScoringResult, Triage } from "./schemas";
import { containment, EvidenceVerifier } from "./verify";

const transcript: Transcript = {
  provider: "deepgram",
  model: "nova-3",
  durationSec: 120,
  speakers: [0, 1],
  confidence: 0.95,
  redactions: ["pci"],
  utterances: [
    { i: 0, speaker: 0, start: 0, end: 4, text: "Thanks for calling Noble Pest, this is Sarah. How can I help you today?", confidence: 0.98 },
    { i: 1, speaker: 1, start: 4, end: 10, text: "Hi, I've got ants all over my kitchen counters.", confidence: 0.97 },
    { i: 2, speaker: 0, start: 10, end: 16, text: "Oh no, I'm so sorry to hear about those ants in your kitchen. I can definitely take care of that for you.", confidence: 0.96 },
    { i: 3, speaker: 0, start: 16, end: 22, text: "That service is usually $299, but this week it's $199 to start and then $49 a month.", confidence: 0.95 },
    { i: 4, speaker: 1, start: 22, end: 26, text: "Okay, let's do it.", confidence: 0.95 },
  ],
};

const speakers: Triage["speakers"] = [
  { speaker: 0, role: "rep", name: "Sarah" },
  { speaker: 1, role: "customer", name: null },
];

function triage(overrides: Partial<Triage> = {}): Triage {
  return {
    speakers,
    repName: "Sarah",
    customerName: null,
    companyName: "Noble Pest",
    direction: "inbound",
    callType: "new_customer",
    callTypeConfidence: "high",
    callTypeReason: "New caller asking for ant service",
