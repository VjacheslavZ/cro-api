/**
 * @module csvImport
 * @description Pure helpers behind the CSV word import: decoding the file bytes, parsing CSV
 * (RFC 4180 quoting, delimiter auto-detected from the first line: tab, semicolon or comma),
 * mapping records to import rows in the fixed column order Hrvatski, Русский, Українська, English,
 * and validating rows with the same limits as the API's ImportPredefinedWordsDto.
 * @usedBy useImportRows, useWordsImport, ImportPreviewTable, ImportPreview, CsvFormatHint,
 * ImportResultAlert, ImportDialogActions
 */

/** Rows sent per request. The API accepts up to 1000 (IMPORT_PREDEFINED_WORDS_MAX_BATCH). */
export const IMPORT_BATCH_SIZE = 500;

/** Editable fields of an import row, in CSV column order. */
export const IMPORT_FIELDS = ['wordHr', 'translationRu', 'translationUk', 'translationEn'] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

/** Column headings shown in the preview, matching the expected CSV header. */
export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  wordHr: 'Hrvatski',
  translationRu: 'Русский',
  translationUk: 'Українська',
  translationEn: 'English',
};

const MAX_LENGTH: Record<ImportField, number> = {
  wordHr: 100,
  translationRu: 200,
  translationUk: 200,
  translationEn: 200,
};

/** One CSV row in the preview. `id` is stable across edits; `line` is the 1-based line in the file. */
export interface ImportRow extends Record<ImportField, string> {
  id: number;
  line: number;
}

/** Body row of POST /admin/dictionary-collections/:id/words/import. */
export type ImportWordPayload = Record<ImportField, string>;

/**
 * - `ok`: will be sent.
 * - `skip`: valid but not sent — the word is already in the collection or repeats an earlier row.
 * - `error`: blocks the import until fixed or removed.
 */
export type RowStatus = 'ok' | 'skip' | 'error';

export interface RowValidation {
  status: RowStatus;
  fieldErrors: Partial<Record<ImportField, string>>;
  message?: string;
}

export interface ImportValidation {
  byId: Map<number, RowValidation>;
  okCount: number;
  skipCount: number;
  errorCount: number;
}

/**
 * Decodes file bytes as UTF-8, or UTF-16 when the file starts with a UTF-16 byte order mark
 * (Excel's "Unicode Text" export). A leading UTF-8 BOM is dropped.
 * @param buffer - Raw file contents
 * @returns The decoded text
 * @throws Error when the bytes are not valid UTF-8 (e.g. a Windows-1251 export)
 */
export function decodeCsvBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('The file is not UTF-8 encoded. Save it as "CSV UTF-8" and try again.');
  }
}

/**
 * Picks the delimiter that occurs most often in the first line, ignoring quoted text.
 * Ties go to tab, then semicolon, then comma.
 * @param text - Whole CSV text
 * @returns One of '\t', ';', ','
 */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0].replace(/"[^"]*"/g, '');
  let best = ',';
  let bestCount = 0;
  for (const candidate of ['\t', ';', ',']) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

/** A parsed CSV record with the file line it starts on (quoted fields may span lines). */
export interface CsvRecord {
  line: number;
  cells: string[];
}

/**
 * Parses CSV text into records. Supports quoted fields with embedded delimiters, newlines and
 * doubled quotes, and LF / CRLF / CR line endings. A leading BOM is ignored.
 * @param text - CSV text
 * @param delimiter - Field delimiter; detected from the first line when omitted
 * @returns Every record, including blank ones
 */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): CsvRecord[] {
  const records: CsvRecord[] = [];
  let cells: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
        continue;
      }
      if (ch === '\n' || (ch === '\r' && text[i + 1] !== '\n')) line += 1;
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"' && field === '') {
      inQuotes = true;
      i += 1;
    } else if (ch === delimiter) {
      cells.push(field);
      field = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      cells.push(field);
      records.push({ line: recordLine, cells });
      cells = [];
      field = '';
      i += ch === '\r' && text[i + 1] === '\n' ? 2 : 1;
      line += 1;
      recordLine = line;
    } else {
      field += ch;
      i += 1;
    }
  }

  if (field !== '' || cells.length > 0) {
    cells.push(field);
    records.push({ line: recordLine, cells });
  }
  return records;
}

const HEADER_FIRST_CELLS = new Set(['hrvatski', 'croatian', 'hr', 'word', 'wordhr']);

function isHeaderRecord(cells: string[]): boolean {
  return (
    HEADER_FIRST_CELLS.has(cells[0]?.trim().toLowerCase() ?? '') ||
    cells[3]?.trim().toLowerCase() === 'english'
  );
}

/**
 * Turns parsed records into import rows: drops a header row if the first record looks like one,
 * drops blank records, trims cells, maps columns 1–4 to wordHr / RU / UK / EN and ignores extra
 * columns. Missing columns become empty strings (flagged later by validateImportRows).
 * @param records - Output of parseCsv
 * @returns Import rows with stable ids
 */
export function recordsToImportRows(records: CsvRecord[]): ImportRow[] {
  const body = records.length > 0 && isHeaderRecord(records[0].cells) ? records.slice(1) : records;
  const rows: ImportRow[] = [];
  for (const { line, cells } of body) {
    const values = IMPORT_FIELDS.map((_, index) => (cells[index] ?? '').trim());
    if (values.every((value) => value === '')) continue;
    rows.push({
      id: rows.length,
      line,
      wordHr: values[0],
      translationRu: values[1],
      translationUk: values[2],
      translationEn: values[3],
    });
  }
  return rows;
}

/**
 * Validates every row. Field errors mirror the API limits (required, max length after trim).
 * Rows whose word already exists in the collection, or repeats an earlier row, are marked `skip`
 * (exact match on the trimmed word, as the database unique key is case-sensitive).
 * @param rows - Current preview rows, in file order
 * @param existingWords - wordHr values already stored in the collection
 * @returns Per-row results keyed by row id, plus status counts
 */
export function validateImportRows(
  rows: readonly ImportRow[],
  existingWords: ReadonlySet<string>,
): ImportValidation {
  const byId = new Map<number, RowValidation>();
  const firstLineByWord = new Map<string, number>();
  let okCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    const fieldErrors: RowValidation['fieldErrors'] = {};
    for (const field of IMPORT_FIELDS) {
      const value = row[field].trim();
      if (value === '') fieldErrors[field] = 'Required';
      else if (value.length > MAX_LENGTH[field]) {
        fieldErrors[field] = `Max ${MAX_LENGTH[field]} characters`;
      }
    }

    const word = row.wordHr.trim();
    const firstLine = word ? firstLineByWord.get(word) : undefined;
    if (word && firstLine === undefined) firstLineByWord.set(word, row.line);

    let result: RowValidation;
    if (Object.keys(fieldErrors).length > 0) {
      result = { status: 'error', fieldErrors, message: Object.values(fieldErrors)[0] };
      errorCount += 1;
    } else if (existingWords.has(word)) {
      result = { status: 'skip', fieldErrors, message: 'Already in collection' };
      skipCount += 1;
    } else if (firstLine !== undefined) {
      result = { status: 'skip', fieldErrors, message: `Duplicate of line ${firstLine}` };
      skipCount += 1;
    } else {
      result = { status: 'ok', fieldErrors };
      okCount += 1;
    }
    byId.set(row.id, result);
  }

  return { byId, okCount, skipCount, errorCount };
}

/**
 * Builds the request rows for every `ok` row, trimmed and in file order.
 * @param rows - Current preview rows
 * @param validation - Result of validateImportRows for the same rows
 */
export function toImportPayload(
  rows: readonly ImportRow[],
  validation: ImportValidation,
): ImportWordPayload[] {
  return rows
    .filter((row) => validation.byId.get(row.id)?.status === 'ok')
    .map((row) => ({
      wordHr: row.wordHr.trim(),
      translationRu: row.translationRu.trim(),
      translationUk: row.translationUk.trim(),
      translationEn: row.translationEn.trim(),
    }));
}

/** Splits items into consecutive batches of at most `size`. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

/** "1 word" / "N words". */
export function formatWordCount(count: number): string {
  return `${count} ${count === 1 ? 'word' : 'words'}`;
}
