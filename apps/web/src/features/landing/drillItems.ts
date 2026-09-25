/**
 * Six fill-in-the-blank items for the landing-page demo — one per oblique case.
 * The nominative is the dictionary form, so it is never drilled here.
 * Kept static on purpose: the demo works for guests with no API call.
 */
export type CaseKey = 'N' | 'G' | 'D' | 'A' | 'V' | 'L' | 'I';

export const CASES: readonly CaseKey[] = ['N', 'G', 'D', 'A', 'V', 'L', 'I'];

export interface DrillItem {
  caseKey: Exclude<CaseKey, 'N'>;
  /** Sentence with a `___` gap. */
  sentenceHr: string;
  /** Dictionary (nominative) form shown as the hint. */
  baseForm: string;
  answer: string;
}

export const DRILL_ITEMS: readonly DrillItem[] = [
  { caseKey: 'L', sentenceHr: 'Živim u ___.', baseForm: 'grad', answer: 'gradu' },
  { caseKey: 'A', sentenceHr: 'Pijem ___.', baseForm: 'kava', answer: 'kavu' },
  { caseKey: 'G', sentenceHr: 'Nema ___.', baseForm: 'kruh', answer: 'kruha' },
  { caseKey: 'D', sentenceHr: 'Dajem ___ knjigu.', baseForm: 'sestra', answer: 'sestri' },
  { caseKey: 'I', sentenceHr: 'Idem s ___.', baseForm: 'prijatelj', answer: 'prijateljem' },
  { caseKey: 'V', sentenceHr: 'Dobar dan, ___!', baseForm: 'gospodin', answer: 'gospodine' },
];

/** Same normalisation the real exercises use: trim + lowercase + NFC. */
export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().normalize('NFC');
}
