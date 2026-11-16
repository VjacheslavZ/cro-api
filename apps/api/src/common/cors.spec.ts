import { describe, it, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';

import { Controller, Get, INestApplication, LoggerService, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { enableCors } from './cors';

@Controller('ping')
class PingController {
  @Get()
  ping() {
    return 'pong';
  }
}

@Module({ controllers: [PingController] })
class PingModule {}

const WEB_ORIGIN = 'https://web.example.com';
const ADMIN_ORIGIN = 'https://admin.example.com';
const OTHER_ORIGIN = 'https://other.example.com';

// Keeps the errors Nest logs, to check that a refused origin is not one of them.
class RecordingLogger implements LoggerService {
  readonly errors: unknown[] = [];

  log() {}

  warn() {}

  error(message: unknown) {
    this.errors.push(message);
  }
}

describe('enableCors', () => {
  let app: INestApplication;
  let url: string;
  let logger: RecordingLogger;

  const start = async (allowLocalNetwork: boolean) => {
    logger = new RecordingLogger();
    const moduleRef = await Test.createTestingModule({ imports: [PingModule] }).compile();
    app = moduleRef.createNestApplication({ logger });
    enableCors(app, { origins: [WEB_ORIGIN, ADMIN_ORIGIN], allowLocalNetwork });
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  };

  const ping = (origin?: string) =>
    fetch(`${url}/ping`, { headers: origin ? { Origin: origin } : {} });

  const preflight = (origin: string) =>
    fetch(`${url}/ping`, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' },
    });

  afterEach(async () => {
    await app.close();
  });

  it('should allow the web app and the admin panel with credentials', async () => {
    await start(false);

    for (const origin of [WEB_ORIGIN, ADMIN_ORIGIN]) {
      const response = await ping(origin);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
      assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
    }
  });

  it('should allow requests without an Origin header', async () => {
    await start(false);

    const response = await ping();
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'pong');
  });

  it('should refuse other origins with 403 and log no error', async () => {
    await start(false);

    const response = await ping(OTHER_ORIGIN);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.deepEqual(logger.errors, []);
  });

  it('should answer preflight requests only for allowed origins', async () => {
    await start(false);

    const allowed = await preflight(WEB_ORIGIN);
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get('access-control-allow-origin'), WEB_ORIGIN);

    const refused = await preflight(OTHER_ORIGIN);
    assert.equal(refused.status, 403);
    assert.equal(refused.headers.get('access-control-allow-origin'), null);
  });

  it('should allow local network origins when enabled', async () => {
    await start(true);

    for (const origin of [
      'http://localhost:5173',
      'http://192.168.1.20:5173',
      'http://10.0.0.5:5174',
    ]) {
      const response = await ping(origin);
      assert.equal(response.status, 200, origin);
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
    }
  });

  it('should refuse local network origins when disabled', async () => {
    await start(false);

    const response = await ping('http://localhost:5173');
    assert.equal(response.status, 403);
  });
});
