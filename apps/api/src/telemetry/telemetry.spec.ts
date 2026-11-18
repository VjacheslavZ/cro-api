import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { NodeSDK } from '@opentelemetry/sdk-node';

import { loadTelemetrySettings, sentryHost, startTelemetry } from './telemetry';

const writeEnvFile = (content: string) => {
  const path = join(mkdtempSync(join(tmpdir(), 'cro-telemetry-')), '.env');
  writeFileSync(path, content);
  return path;
};

describe('startTelemetry', () => {
  it('should start nothing without OTEL_EXPORTER_OTLP_ENDPOINT', () => {
    assert.equal(startTelemetry({}), undefined);
  });

  it('should start the SDK when the endpoint is set', async () => {
    const sdk = startTelemetry({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318' });

    assert.ok(sdk instanceof NodeSDK);
    await sdk.shutdown();
  });
});

describe('loadTelemetrySettings', () => {
  it('should copy only OTEL_ and SENTRY_ variables from the file', () => {
    const path = writeEnvFile(
      'OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"\nDATABASE_URL="postgresql://x"\nSENTRY_DSN="https://key@example.ingest.sentry.io/1"\n',
    );
    const env: NodeJS.ProcessEnv = {};

    loadTelemetrySettings(path, env);

    assert.deepEqual(env, {
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
      SENTRY_DSN: 'https://key@example.ingest.sentry.io/1',
    });
  });

  it('should keep variables that are already set', () => {
    const path = writeEnvFile('OTEL_SERVICE_NAME="from-file"\n');
    const env: NodeJS.ProcessEnv = { OTEL_SERVICE_NAME: 'from-shell' };

    loadTelemetrySettings(path, env);

    assert.equal(env.OTEL_SERVICE_NAME, 'from-shell');
  });

  it('should do nothing when the file does not exist', () => {
    const env: NodeJS.ProcessEnv = {};

    loadTelemetrySettings(join(tmpdir(), 'cro-no-such-dir', '.env'), env);

    assert.deepEqual(env, {});
  });
});

describe('sentryHost', () => {
  it('should return the host of the Sentry DSN', () => {
    assert.equal(sentryHost('https://key@o1.ingest.de.sentry.io/42'), 'o1.ingest.de.sentry.io');
  });

  it('should return undefined without a valid DSN', () => {
    assert.equal(sentryHost(undefined), undefined);
    assert.equal(sentryHost(''), undefined);
    assert.equal(sentryHost('not a url'), undefined);
  });
});
