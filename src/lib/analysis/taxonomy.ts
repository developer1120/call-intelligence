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
  scheduling:
    "An existing customer scheduling, confirming or changing the date/time of a regular service appointment, or giving notes for an upcoming visit (gate codes, pets, not home).",
  billing:
    "An existing customer calling about an invoice, payment, upcoming charge, balance, declined card or updating the payment method on file, including calls prompted by collection notices.",
  reservice:
    "An existing customer reporting pests between scheduled services or a problem with a past treatment (missed spots, still seeing bugs) and needing a re-service.",
  retention:
    "An existing customer who wants to cancel (or is threatening to), or the company calling a customer back after a cancel request by text/email. Scored on the Retention scorecard.",
  other:
    "Any other real customer conversation: changing service address, feedback about a technician, asking for an invoice to be re-sent, general questions.",
  not_scoreable:
    "No real two-way customer conversation with a rep: voicemail, wrong number, spam/solicitation, a vendor/internal call, or a call that drops before the customer's need is discussed.",
};

export const NOT_SCOREABLE_REASONS = [
  "voicemail",
  "wrong_number",
  "spam_or_solicitation",
  "internal_or_vendor",
  "dropped_or_too_short",
  "none",
] as const;

export function scorecardFor(type: CallType): ScorecardId | null {
  switch (type) {
    case "new_customer":
      return "sales";
