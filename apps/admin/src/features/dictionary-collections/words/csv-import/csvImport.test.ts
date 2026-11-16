import {
  chunk,
  decodeCsvBuffer,
  detectDelimiter,
  parseCsv,
  recordsToImportRows,
  toImportPayload,
  validateImportRows,
  type ImportRow,
} from './csvImport';

const encode = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;

function row(id: number, wordHr: string, overrides: Partial<ImportRow> = {}): ImportRow {
  return {
    id,
    line: id + 2,
    wordHr,
    translationRu: `${wordHr}-ru`,
    translationUk: `${wordHr}-uk`,
    translationEn: `${wordHr}-en`,
    ...overrides,
  };
}

describe('detectDelimiter', () => {
  it.each([
    ['Hrvatski\tРусский\tУкраїнська\tEnglish', '\t'],
    ['Hrvatski;Русский;Українська;English', ';'],
    ['Hrvatski,Русский,Українська,English', ','],
  ])('detects the delimiter in %j', (text, expected) => {
    expect(detectDelimiter(text)).toBe(expected);
  });

  it('ignores delimiters inside quotes', () => {
    expect(detectDelimiter('"a,b,c";"d"')).toBe(';');
  });
});

describe('parseCsv', () => {
  it('parses quoted fields with delimiters, doubled quotes and newlines', () => {
    const records = parseCsv('a,"b, c","say ""hi""","x\ny"\nnext,1,2,3');

    expect(records).toEqual([
      { line: 1, cells: ['a', 'b, c', 'say "hi"', 'x\ny'] },
      { line: 3, cells: ['next', '1', '2', '3'] },
    ]);
  });

  it('handles CRLF, a BOM and a missing trailing newline', () => {
    expect(parseCsv('﻿a;b\r\nc;d', ';')).toEqual([
      { line: 1, cells: ['a', 'b'] },
      { line: 2, cells: ['c', 'd'] },
    ]);
  });

  it('does not emit an extra record for a trailing newline', () => {
    expect(parseCsv('a,b\n')).toHaveLength(1);
  });
});

describe('recordsToImportRows', () => {
  it('skips a header row and blank lines, trims cells and maps columns in order', () => {
    const rows = recordsToImportRows(
      parseCsv('Hrvatski,Русский,Українська,English\n\n kruh ,хлеб,хліб,bread,extra\n'),
    );

    expect(rows).toEqual([
      {
        id: 0,
        line: 3,
        wordHr: 'kruh',
        translationRu: 'хлеб',
        translationUk: 'хліб',
        translationEn: 'bread',
      },
    ]);
  });

  it('keeps the first row when it is not a header', () => {
    expect(recordsToImportRows(parseCsv('kruh,хлеб,хліб,bread'))).toHaveLength(1);
  });

  it('fills missing columns with empty strings', () => {
    const [first] = recordsToImportRows(parseCsv('kruh,хлеб'));

    expect(first.translationUk).toBe('');
    expect(first.translationEn).toBe('');
  });
});

describe('validateImportRows', () => {
  it('marks missing and too-long fields as errors', () => {
    const rows = [row(0, 'kruh', { translationEn: '  ' }), row(1, 'x'.repeat(101))];

    const result = validateImportRows(rows, new Set());

    expect(result.byId.get(0)).toMatchObject({
      status: 'error',
      fieldErrors: { translationEn: 'Required' },
    });
    expect(result.byId.get(1)?.fieldErrors.wordHr).toBe('Max 100 characters');
    expect(result.errorCount).toBe(2);
  });

  it('skips words already in the collection and later repeats in the file', () => {
    const rows = [row(0, 'kruh'), row(1, 'voda'), row(2, 'kruh'), row(3, 'mlijeko')];

    const result = validateImportRows(rows, new Set(['mlijeko']));

    expect(result.byId.get(0)?.status).toBe('ok');
    expect(result.byId.get(2)).toMatchObject({ status: 'skip', message: 'Duplicate of line 2' });
    expect(result.byId.get(3)).toMatchObject({ status: 'skip', message: 'Already in collection' });
    expect(result).toMatchObject({ okCount: 2, skipCount: 2, errorCount: 0 });
  });
});

describe('toImportPayload', () => {
  it('returns trimmed ok rows only, without ids', () => {
    const rows = [row(0, ' kruh '), row(1, 'kruh'), row(2, '')];
    const payload = toImportPayload(rows, validateImportRows(rows, new Set()));

    expect(payload).toEqual([
      {
        wordHr: 'kruh',
        translationRu: 'kruh -ru',
        translationUk: 'kruh -uk',
        translationEn: 'kruh -en',
      },
    ]);
  });
});

describe('decodeCsvBuffer', () => {
  it('decodes UTF-8 and drops the BOM', () => {
    expect(decodeCsvBuffer(encode('﻿čaša;чашка'))).toBe('čaša;чашка');
  });

  it('decodes UTF-16LE with a BOM', () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0x61, 0x00, 0x09, 0x00, 0x34, 0x04]);

    expect(decodeCsvBuffer(bytes.buffer)).toBe('a\tд');
  });

  it('rejects bytes that are not UTF-8', () => {
    expect(() => decodeCsvBuffer(new Uint8Array([0xf7, 0xe0]).buffer)).toThrow(/UTF-8/);
  });
});

describe('chunk', () => {
  it('splits into batches of at most the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
