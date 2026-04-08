export interface PoolLetter {
  id: number;
  char: string;
  used: boolean;
}

const EXTRA_CHARS = 'abcdefghijklmnoprstuvzščćđ';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildPool(wordHr: string): PoolLetter[] {
  const wordLetters = wordHr.toLowerCase().split('');
  const extraCount = Math.ceil(wordLetters.length * 0.25);
  const extras = Array.from(
    { length: extraCount },
    () => EXTRA_CHARS[Math.floor(Math.random() * EXTRA_CHARS.length)],
  );
  return shuffle([...wordLetters, ...extras]).map((char, idx) => ({ id: idx, char, used: false }));
}
