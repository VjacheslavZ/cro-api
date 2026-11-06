import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis';

import { RedisHealthIndicator } from './redis.health';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;

  beforeEach(() => {
    const configService = { get: () => 'redis://localhost:1' } as unknown as ConfigService;
    indicator = new RedisHealthIndicator(configService, new HealthIndicatorService());
  });

  afterEach(() => {
    indicator.onModuleDestroy();
    mock.restoreAll();
  });

  it('reports up when Redis answers the ping', async () => {
    mock.method(Redis.prototype, 'ping', async () => 'PONG');

    assert.deepEqual(await indicator.pingCheck('redis'), { redis: { status: 'up' } });
  });

  it('reports down without exposing the error when the ping fails', async () => {
    mock.method(Redis.prototype, 'ping', async () => {
      throw new Error('connect ECONNREFUSED 10.0.0.5:6379');
    });

    assert.deepEqual(await indicator.pingCheck('redis'), { redis: { status: 'down' } });
  });
});
