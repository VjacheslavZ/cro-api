import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';

import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { trustLoadBalancer } from './trust-load-balancer';

@Controller('ping')
class PingController {
  @Get()
  ping() {
    return 'pong';
  }
}

// Two requests per client per minute, so the third one is rejected.
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 2 }])],
  controllers: [PingController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
class ThrottledModule {}

const CLIENT_A = '203.0.113.10';
const CLIENT_B = '203.0.113.20';

describe('trustLoadBalancer', () => {
  let app: INestApplication;
  let url: string;

  // The test client connects from 127.0.0.1 and plays the load balancer:
  // forwardedFor is the X-Forwarded-For value the load balancer would send.
  const ping = async (forwardedFor: string) => {
    const response = await fetch(`${url}/ping`, {
      headers: { 'X-Forwarded-For': forwardedFor },
    });
    return response.status;
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ThrottledModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    trustLoadBalancer(app);
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should rate limit each client separately', async () => {
    assert.equal(await ping(CLIENT_A), 200);
    assert.equal(await ping(CLIENT_A), 200);
    assert.equal(await ping(CLIENT_A), 429);

    assert.equal(await ping(CLIENT_B), 200);
  });

  it('should ignore X-Forwarded-For entries the client added itself', async () => {
    assert.equal(await ping(CLIENT_A), 200);
    assert.equal(await ping(CLIENT_A), 200);

    // The client sent a fake address, and the load balancer appended the real one.
    assert.equal(await ping(`198.51.100.7, ${CLIENT_A}`), 429);
  });
});
