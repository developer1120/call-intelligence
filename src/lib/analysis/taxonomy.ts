import type { ScorecardId } from "./rubrics";

export const CALL_TYPES = [
  "new_customer",
  "scheduling",
  "billing",
  "reservice",
  "retention",
  "other",
  "not_scoreable",
] as const;
export type CallType = (typeof CALL_TYPES)[number];

export const CALL_TYPE_LABEL: Record<CallType, string> = {
  new_customer: "New Customer",
  scheduling: "Scheduling",
  billing: "Billing",
  reservice: "Re-service",
  retention: "Retention",
  other: "Other",
  not_scoreable: "Not scoreable",
};

/** Definitions given to the AI, paraphrased from the Office Call Manual "Call Types" section. */
export const CALL_TYPE_DEFINITIONS: Record<CallType, string> = {
  new_customer:
    "Someone who is NOT yet a customer asking about service: an inbound sales opportunity (quote, pricing, first service). Also outbound sales follow-ups to prospects. Recently signed-up customers calling about scheduling/billing are NOT this type.",
