import { describe, it, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { logAddresses, redisAddress } from './log-addresses';

const options = {
  port: 3000,
  webUrl: 'http://localhost:5173',
  adminUrl: 'http://localhost:5174',
  swaggerEnabled: false,
};

const captureOutput = (run: () => void): string[] => {
  const log = mock.method(console, 'log', () => {});
  try {
    run();
    return log.mock.calls.map((call) => String(call.arguments[0]));
  } finally {
    log.mock.restore();
  }
};

describe('logAddresses', () => {
  it('should show Grafana under Local when its URL is given', () => {
    const lines = captureOutput(() =>
      logAddresses({ ...options, grafanaUrl: 'http://localhost:3001' }),
    );

    // Exactly one line: Local only, never repeated under Network.
    assert.deepEqual(
      lines.filter((line) => line.includes('Grafana')),
      ['    📊 Grafana: http://localhost:3001'],
    );
  });

  it('should show the Redis host and port without the password', () => {
    const lines = captureOutput(() =>
      logAddresses({ ...options, redisUrl: 'redis://user:secret@localhost:6379' }),
    );

    assert.deepEqual(
      lines.filter((line) => line.includes('Redis')),
      ['    🧱 Redis:   localhost:6379'],
    );
    assert.equal(
      lines.some((line) => line.includes('secret')),
      false,
    );
  });

  it('should not show Grafana without its URL', () => {
    const lines = captureOutput(() => logAddresses(options));

    assert.equal(
      lines.some((line) => line.includes('Grafana')),
      false,
    );
  });
});

describe('redisAddress', () => {
  it('should use the default port when the URL has none', () => {
    assert.equal(redisAddress('rediss://cache.example.com'), 'cache.example.com:6379');
  });
});
