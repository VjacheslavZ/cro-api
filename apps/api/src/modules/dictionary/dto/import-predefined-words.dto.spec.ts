import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
  IMPORT_PREDEFINED_WORDS_MAX_BATCH,
  ImportPredefinedWordsDto,
} from './import-predefined-words.dto';

const row = {
  wordHr: 'kruh',
  translationRu: 'хлеб',
  translationUk: 'хліб',
  translationEn: 'bread',
};

async function check(body: unknown) {
  const dto = plainToInstance(ImportPredefinedWordsDto, body);
  const errors = await validate(dto, { whitelist: true });
  return { dto, errors };
}

describe('ImportPredefinedWordsDto', () => {
  it('accepts a valid batch and trims every field', async () => {
    const { dto, errors } = await check({
      words: [{ ...row, wordHr: '  kruh ', translationEn: ' bread\t' }],
    });

    assert.equal(errors.length, 0);
    assert.equal(dto.words[0].wordHr, 'kruh');
    assert.equal(dto.words[0].translationEn, 'bread');
  });

  it('rejects a field that is empty after trimming', async () => {
    const { errors } = await check({ words: [{ ...row, translationUk: '   ' }] });

    assert.equal(errors.length, 1);
  });

  it('rejects a row with a missing field', async () => {
    const { errors } = await check({ words: [{ ...row, translationRu: undefined }] });

    assert.equal(errors.length, 1);
  });

  it('rejects an empty batch', async () => {
    const { errors } = await check({ words: [] });

    assert.equal(errors.length, 1);
  });

  it(`rejects more than ${IMPORT_PREDEFINED_WORDS_MAX_BATCH} rows`, async () => {
    const words = Array.from({ length: IMPORT_PREDEFINED_WORDS_MAX_BATCH + 1 }, (_, i) => ({
      ...row,
      wordHr: `w${i}`,
    }));
    const { errors } = await check({ words });

    assert.equal(errors.length, 1);
  });
});
