import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { ERROR_REPORT_DATA, startErrorTracking } from './sentry';

describe('startErrorTracking', () => {
  it('should start nothing without SENTRY_DSN', () => {
    assert.equal(startErrorTracking({}), undefined);
  });

  it('should start Sentry with the DSN and the environment', async () => {
    const client = startErrorTracking({
      SENTRY_DSN: 'http://public@127.0.0.1:9/1',
      NODE_ENV: 'production',
    });

    assert.ok(client);
    const options = client.getOptions();
    assert.equal(options.environment, 'production');
    assert.equal(options.enableOpenTelemetrySetup, false);
    // Tracing stays with OpenTelemetry.
    assert.equal(options.tracesSampleRate, undefined);
    await client.close(0);
  });

  it('should prefer SENTRY_ENVIRONMENT over NODE_ENV', async () => {
    const client = startErrorTracking({
      SENTRY_DSN: 'http://public@127.0.0.1:9/1',
      SENTRY_ENVIRONMENT: 'staging',
      NODE_ENV: 'production',
    });

    assert.equal(client?.getOptions().environment, 'staging');
    await client?.close(0);
  });
});

describe('ERROR_REPORT_DATA', () => {
  it('should send no user data, secrets or request contents with an error', () => {
    assert.deepEqual(ERROR_REPORT_DATA, {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    });
  });
});
