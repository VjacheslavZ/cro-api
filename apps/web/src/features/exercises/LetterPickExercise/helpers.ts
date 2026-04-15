/**
 * @module LetterPickExercise/helpers
 * @description Utilities for the letter-pick exercise: letter pool generation and shuffling.
 * @usedBy LetterPickExercise
 */

/** Represents a single letter tile in the pick pool. */
export interface PoolLetter {
  id: number;
  char: string;
  used: boolean;
}

const EXTRA_CHARS = 'abcdefghijklmnoprstuvzščćđ';

/**
 * Returns a new array with elements in random order (Fisher-Yates).
 * @param arr - The array to shuffle
 * @returns A new shuffled array; the original is not modified
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds a shuffled letter pool for a Croatian word.
 * Contains all letters of the word plus ~25% random extra Croatian characters as distractors.
 * @param wordHr - The Croatian word to build the pool for
 * @returns Shuffled array of PoolLetter tiles with unique IDs and `used: false`
 */
export function buildPool(wordHr: string): PoolLetter[] {
  const wordLetters = wordHr.toLowerCase().split('');
  const extraCount = Math.ceil(wordLetters.length * 0.25);
  const extras = Array.from(
    { length: extraCount },
    () => EXTRA_CHARS[Math.floor(Math.random() * EXTRA_CHARS.length)],
  );
  return shuffle([...wordLetters, ...extras]).map((char, idx) => ({ id: idx, char, used: false }));
}
