import { describe, it, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';

import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { SWAGGER_PATH, setupSwagger } from './swagger';

@Controller('ping')
class PingController {
  @Get()
  ping() {
    return 'pong';
  }
}

@Module({ controllers: [PingController] })
class PingModule {}

describe('setupSwagger', () => {
  let app: INestApplication;

  // Returns the status of GET /api/docs and whether setupSwagger reported the docs as served.
  const startWith = async (nodeEnv: string) => {
    const moduleRef = await Test.createTestingModule({ imports: [PingModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    const served = setupSwagger(app, nodeEnv);
    await app.listen(0, '127.0.0.1');
    const response = await fetch(`${await app.getUrl()}/${SWAGGER_PATH}`);
    return { served, status: response.status };
  };

  afterEach(async () => {
    await app.close();
  });

  it('should not serve the docs in production', async () => {
    assert.deepEqual(await startWith('production'), { served: false, status: 404 });
  });

  it('should serve the docs in development', async () => {
    assert.deepEqual(await startWith('development'), { served: true, status: 200 });
  });
});
