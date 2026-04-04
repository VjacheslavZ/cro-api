export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase().normalize('NFC');
}
