import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { envSchema } from './env.validation';

const baseEnv = {
  DATABASE_URL: 'postgresql://cro:secret@localhost:5432/cro',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'a'.repeat(16),
  JWT_REFRESH_SECRET: 'b'.repeat(16),
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
};

describe('envSchema BETTER_AUTH_SECRET', () => {
  it('is optional outside production', () => {
    assert.equal(envSchema.safeParse({ ...baseEnv, NODE_ENV: 'development' }).success, true);
  });

  it('is required in production', () => {
    const result = envSchema.safeParse({ ...baseEnv, NODE_ENV: 'production' });

    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0].path, ['BETTER_AUTH_SECRET']);
  });

  it('accepts a long enough secret in production', () => {
    const env = { ...baseEnv, NODE_ENV: 'production', BETTER_AUTH_SECRET: 'c'.repeat(32) };

    assert.equal(envSchema.safeParse(env).success, true);
  });

  it('rejects a short secret', () => {
    const env = { ...baseEnv, BETTER_AUTH_SECRET: 'too-short' };

    assert.equal(envSchema.safeParse(env).success, false);
  });
});
