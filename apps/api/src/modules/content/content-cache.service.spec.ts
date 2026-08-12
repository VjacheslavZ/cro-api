import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import Redis from 'ioredis';

import { ContentCacheService } from './content-cache.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockConfigService() {
  const values: Record<string, unknown> = {
    REDIS_URL: 'redis://localhost:1',
  };
  return {
    get: mock.fn((key: string, fallback?: unknown) => values[key] ?? fallback) as MockFn,
  };
}

describe('ContentCacheService', () => {
  let service: ContentCacheService;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(() => {
    mock.method(Redis.prototype, 'connect', async () => undefined as unknown as void);
    mock.method(Redis.prototype, 'get', async () => null);
    mock.method(Redis.prototype, 'set', async () => 'OK');
    mock.method(Redis.prototype, 'del', async () => 1);
    mock.method(Redis.prototype, 'keys', async () => [] as string[]);

    configService = createMockConfigService();
    service = new ContentCacheService(configService as never);
  });

  describe('get', () => {
    it('should return the parsed value when the key exists', async () => {
      mock.method(Redis.prototype, 'get', async () => JSON.stringify({ foo: 'bar' }));

      const result = await service.get<{ foo: string }>('some-key');

      assert.deepEqual(result, { foo: 'bar' });
    });

    it('should return null when the key does not exist', async () => {
      mock.method(Redis.prototype, 'get', async () => null);

      const result = await service.get('missing-key');

      assert.equal(result, null);
    });
  });

  describe('set', () => {
    it('should store the value as JSON with the TTL', async () => {
      const setMock = mock.method(Redis.prototype, 'set', async () => 'OK');

      await service.set('some-key', { foo: 'bar' });

      assert.equal(setMock.mock.callCount(), 1);
      const args = setMock.mock.calls[0].arguments;
      assert.equal(args[0], 'some-key');
      assert.equal(args[1], JSON.stringify({ foo: 'bar' }));
      assert.equal(args[2], 'EX');
      assert.equal(args[3], 300);
    });
  });

  describe('invalidate', () => {
    it('should delete the given keys', async () => {
      const delMock = mock.method(Redis.prototype, 'del', async () => 2);

      await service.invalidate('key1', 'key2');

      assert.equal(delMock.mock.callCount(), 1);
      assert.deepEqual(delMock.mock.calls[0].arguments, ['key1', 'key2']);
    });

    it('should not call del when no keys are given', async () => {
      const delMock = mock.method(Redis.prototype, 'del', async () => 0);

      await service.invalidate();

      assert.equal(delMock.mock.callCount(), 0);
    });
  });

  describe('invalidatePattern', () => {
    it('should delete all keys matching the pattern', async () => {
      mock.method(Redis.prototype, 'keys', async () => ['topic:1', 'topic:2']);
      const delMock = mock.method(Redis.prototype, 'del', async () => 2);

      await service.invalidatePattern('topic:*');

      assert.equal(delMock.mock.callCount(), 1);
      assert.deepEqual(delMock.mock.calls[0].arguments, ['topic:1', 'topic:2']);
    });

    it('should not call del when no keys match the pattern', async () => {
      mock.method(Redis.prototype, 'keys', async () => []);
      const delMock = mock.method(Redis.prototype, 'del', async () => 0);

      await service.invalidatePattern('missing:*');

      assert.equal(delMock.mock.callCount(), 0);
    });
  });
});
