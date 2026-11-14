import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';

import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

import { REQUESTS_PER_MINUTE, RateLimitModule } from './rate-limit.module';

@Controller()
class TestController {
  @Get('default')
  byDefault() {
    return 'ok';
  }

  @Get('strict')
  @Throttle({ default: { ttl: 60_000, limit: 2 } })
  strict() {
    return 'ok';
  }

  @Get('unlimited')
  @SkipThrottle()
  unlimited() {
    return 'ok';
  }
}

@Module({ imports: [RateLimitModule], controllers: [TestController] })
class TestModule {}

describe('RateLimitModule', () => {
  let app: INestApplication;
  let url: string;

  // Sends count requests one after another and returns their status codes.
  const get = async (path: string, count: number) => {
    const statuses: number[] = [];
    for (let i = 0; i < count; i += 1) {
      statuses.push((await fetch(`${url}/${path}`)).status);
    }
    return statuses;
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should reject requests over the default limit', async () => {
    const statuses = await get('default', REQUESTS_PER_MINUTE + 1);

    assert.ok(statuses.slice(0, REQUESTS_PER_MINUTE).every((status) => status === 200));
    assert.equal(statuses[REQUESTS_PER_MINUTE], 429);
  });

  it('should apply a stricter limit set with @Throttle', async () => {
    assert.deepEqual(await get('strict', 3), [200, 200, 429]);
  });

  it('should not limit routes marked with @SkipThrottle', async () => {
    const statuses = await get('unlimited', REQUESTS_PER_MINUTE + 1);

    assert.ok(statuses.every((status) => status === 200));
  });
});
