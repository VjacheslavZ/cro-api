import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { normalizeAnswer } from './index';

describe('normalizeAnswer', () => {
  it('trims leading and trailing whitespace', () => {
    assert.equal(normalizeAnswer('  kruh  '), 'kruh');
  });

  it('lowercases the input', () => {
    assert.equal(normalizeAnswer('KRUH'), 'kruh');
  });

  it('NFC-normalizes diacritics so precomposed and decomposed forms match', () => {
    const precomposed = 'č'; // U+010D, single code point
    const decomposed = 'č'; // 'c' + combining caron, two code points
    assert.equal(normalizeAnswer(precomposed), normalizeAnswer(decomposed));
  });

  it('combines trim, lowercase, and NFC normalization together', () => {
    assert.equal(normalizeAnswer('  ČOKOLADA  '), 'čokolada');
  });

  it('returns an empty string for whitespace-only input', () => {
    assert.equal(normalizeAnswer('   '), '');
  });

  it('leaves an already-normalized answer unchanged', () => {
    assert.equal(normalizeAnswer('kruh'), 'kruh');
  });
});
