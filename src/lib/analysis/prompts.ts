import type { Transcript } from "@/lib/transcription/types";
import type { Scorecard } from "./rubrics";
import type { Triage } from "./schemas";
import {
  CALL_TYPE_DEFINITIONS,
  CALL_TYPE_LABEL,
  CALL_TYPES,
  OUTCOME_DEFINITIONS,
  OUTCOMES,
} from "./taxonomy";

/** Bump when prompts or rubric wording change, so stored analyses can be compared. */
export const PROMPT_VERSION = "2026-10-20.6";

export function clock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Transcript as the model sees it. Utterance indexes are how it cites evidence. */
export function renderTranscript(t: Transcript, speakers?: Triage["speakers"]): string {
  const label = new Map<number, string>();
  for (const s of speakers ?? []) {
    const role = s.role === "rep" ? "REP" : s.role === "customer" ? "CUSTOMER" : "OTHER";
    label.set(s.speaker, s.name ? `${role} (${s.name})` : role);
  }
  return t.utterances
    .map((u) => `[u${u.i} ${clock(u.start)}] ${label.get(u.speaker) ?? `S${u.speaker}`}: ${u.text}`)
    .join("\n");
}

const EVIDENCE_RULES = `
Evidence rules (these are checked by software against the transcript, and unverifiable claims are thrown out):
- Every evidence item is {u, quote}: u is the utterance index shown as [u12 …], quote is words copied EXACTLY from that utterance. Never paraphrase, merge distant lines, or fix grammar.
- Keep quotes short (the decisive 5–25 words).
- Only use what was actually said on this call. If something was not said, it did not happen. Use null for unknown facts; never guess names, prices or dates.
- The transcript is machine-generated: words can be slightly misheard and speaker numbers are occasionally mixed up (a quick reply from the other person can land inside a line). Judge by meaning and context, but quote the text as written.
- Prices are often mis-formatted by the transcriber: "$1.79" or "$6.49" usually means $179 / $649 when said as "one seventy-nine"; "$638,000,000" means $638. Read prices from context.
- Company names are often misheard (e.g. "Bug Bully" written as "BugWoolly", "Bonvoy" or "Doug Bully"). Use the most plausible real name.
- [CREDIT_CARD_n], [CVV_n] and [REDACTED] mark payment details removed for privacy. [NAME], [PHONE], [EMAIL], [ADDRESS] and [ZIP] mark customer contact details masked for privacy: treat them as present (e.g. the rep did collect the address) but never try to guess them, and return null for customerName when it is masked. Employee names are not masked.`.trim();

export const TRIAGE_SYSTEM = `
You are PestLaunch's call analyst. PestLaunch is the operating system for residential pest control companies. You read one recorded phone call between a pest control company's office/sales rep and a caller, and produce a precise, evidence-based record the business owner can trust.

How calls reach the office: callers hear "Dial 1 for New Customer, 2 for Scheduling, 3 for Billing, or 4 for All Other Calls". Callers sometimes press the wrong option, so classify by what the call is actually about.

Call types (pick exactly one):
${CALL_TYPES.map((t) => `- ${t} (${CALL_TYPE_LABEL[t]}): ${CALL_TYPE_DEFINITIONS[t]}`).join("\n")}
Classification notes:
- Classify by the primary reason for the conversation. A cancel request that turns into a reschedule is still retention.
- Calls can be outbound (the rep calls a lead or customer): an outbound call to a prospect/lead about a quote or inspection is new_customer; an outbound call to arrange a customer's next visit is scheduling.
- A prospect who already agreed (e.g. by email) and is now booking their first service is still new_customer. A former customer who is not currently on service and wants a new quote is new_customer.
- An existing customer reporting pest activity or a treatment problem that needs a technician visit (bugs between services, a new nest, missed spots) is reservice. Questions about the status or timing of work already scheduled or in progress, with no new pest problem, are scheduling (or other).
- Automated call screening, voicemail greetings and hold messages are speaker role "other"; if a real conversation follows, classify the conversation.
- Set notScoreableReason to "none" unless callType is not_scoreable.
- PestLaunch serves many pest control companies; the company can differ between calls.

Outcome (pick exactly one, describing how the call ended):
${OUTCOMES.map((o) => `- ${o}: ${OUTCOME_DEFINITIONS[o]}`).join("\n")}
For prospects, a scheduled inspection or estimate visit counts as booked (the lead became an appointment). If the prospect only took information to decide later, it is follow_up.

Speakers: map every speaker number to rep (the company employee), customer (caller/prospect), or other (IVR/hold recording, technician, third party). Use names only if said on the call.

Business signals the owner cares about:
- followUps: concrete promises someone must remember to act on after the call (call back, send a quote/agreement/invoice, check availability and get back to them, talk to a technician about a complaint, manager to reach out, customer to send proof of move). Not the booked visit itself, routine account notes, or pleasantries.
- opportunities: revenue or relationship chances present on this call — e.g. add-on services (mosquito, termite, rodent, interior), positioning the company as the one-stop shop for all pests, asking for referrals, asking for a review after a great experience, booking a prospect who was on the fence, saving a cancel, annual prepay. Set captured=true only if the rep actually acted on it.
- risks: churn signals, complaints, technician problems, billing disputes, property damage claims, safety concerns (pets, kids, chemicals), threats of bad reviews, requests to escalate. Severity high = likely to cost a customer or a public review.
- objections: customer push-back on buying or staying (price, needs to ask spouse, shopping around, not ready to start yet, trust, doesn't think they need it, contract, wants a one-time service instead of a plan). Plain questions are not objections, and neither is scheduling logistics (which day/time works, needing to be home, a meeting during the window).
