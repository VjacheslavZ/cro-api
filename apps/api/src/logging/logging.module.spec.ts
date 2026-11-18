import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Writable } from 'node:stream';

import pino, { type LoggerOptions } from 'pino';
import type { Options } from 'pino-http';

import { createLoggerParams, requestPath } from './logging.module';

const httpOptions = (nodeEnv: string) => createLoggerParams(nodeEnv).pinoHttp as Options;

/** Writes one record with the production options and returns it as text. */
const productionLine = (write: (logger: pino.Logger) => void): string => {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  write(pino(httpOptions('production') as LoggerOptions, destination));
  return lines.join('');
};

describe('createLoggerParams', () => {
  it('should write ERROR in production, which the CloudWatch metric filter counts', () => {
    const line = productionLine((logger) => logger.error('boom'));

    assert.match(line, /"level":"ERROR"/);
    assert.equal(httpOptions('production').transport, undefined);
  });

  it('should print readable lines through pino-pretty in development', () => {
    const options = httpOptions('development');

    assert.deepEqual((options.transport as { target: string }).target, 'pino-pretty');
    assert.equal(options.formatters, undefined);
  });

  it('should log only the method, path and status of a request', () => {
    const { serializers } = httpOptions('production');
    const request = {
      id: 7,
      method: 'GET',
      url: '/api/auth/callback/google?code=secret-code',
      headers: { cookie: 'session=secret-cookie' },
      socket: { remoteAddress: '203.0.113.9' },
    } as unknown as IncomingMessage;

    const logged = JSON.stringify([
      serializers!.req(request),
      serializers!.res({ statusCode: 302 } as ServerResponse),
    ]);

    assert.equal(
      logged,
      JSON.stringify([
        { id: 7, method: 'GET', path: '/api/auth/callback/google' },
        { statusCode: 302 },
      ]),
    );
  });

  it('should not log load balancer health checks', () => {
    const autoLogging = httpOptions('production').autoLogging as {
      ignore: (request: IncomingMessage) => boolean;
    };

    assert.equal(autoLogging.ignore({ url: '/health/ready' } as IncomingMessage), true);
    assert.equal(autoLogging.ignore({ url: '/content/topics' } as IncomingMessage), false);
  });
});

describe('requestPath', () => {
  it('should drop the query string', () => {
    assert.equal(requestPath('/dictionary/words?cursor=abc'), '/dictionary/words');
    assert.equal(requestPath('/content/topics'), '/content/topics');
    assert.equal(requestPath(undefined), undefined);
  });
});
