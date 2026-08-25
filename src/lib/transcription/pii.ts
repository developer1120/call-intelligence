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
