/**
 * Masks customer contact details (names, phone numbers, emails, street addresses, ZIPs)
 * in the transcript, using the entities Deepgram detects. The employee's own name from the
 * greeting ("…this is Kristen") is kept so calls can still be attributed to the right rep.
 * Runs before anything is stored or sent to an AI model.
 */

export interface DgWord {
  word?: string;
  punctuated_word?: string;
  start?: number;
  end?: number;
}

export interface DgEntity {
  label?: string;
  value?: string;
  start_word?: number;
  end_word?: number;
}

const PLACEHOLDER: Record<string, string> = {
  NAME: "[NAME]",
  NAME_GIVEN: "[NAME]",
  NAME_FAMILY: "[NAME]",
  NAME_MEDICAL_PROFESSIONAL: "[NAME]",
  PHONE_NUMBER: "[PHONE]",
  EMAIL_ADDRESS: "[EMAIL]",
  LOCATION_ADDRESS: "[ADDRESS]",
  LOCATION_ADDRESS_STREET: "[ADDRESS]",
  LOCATION_ZIP: "[ZIP]",
  USERNAME: "[EMAIL]",
};

const NAME_LABELS = new Set(["NAME", "NAME_GIVEN", "NAME_FAMILY"]);

/**
 * Employee names said in a company greeting: "Thank you for calling Bug Bully, this is Griffin",
 * "Endeavor Pest Management. This is Elijah speaking", "This is Kevin from Bug Bully".
 */
export function employeeNames(texts: string[]): Set<string> {
  const names = new Set<string>();
  const patterns = [
    /thank you for calling[^.?!]*?[.,]?\s*this is ([A-Z][a-z]+)/i,
    /\b[Tt]his is ([A-Z][a-z]+)(?: speaking| from| with)\b/,
    /\b([A-Z][a-z]+) speaking\b/,
    /\b(?:it's|this is) ([A-Z][a-z]+) from\b/i,
    /\b([A-Z][a-z]+) from (?:bug|endeavor|noble|abc)/i,
  ];
  for (const t of texts.slice(0, 8)) {
    for (const p of patterns) {
      const m = p.exec(t);
      if (m && !["the", "this", "calling"].includes(m[1].toLowerCase())) names.add(m[1].toLowerCase());
    }
  }
  return names;
}
