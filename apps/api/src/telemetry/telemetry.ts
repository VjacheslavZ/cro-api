import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const DEFAULT_SERVICE_NAME = 'cro-api';
// The OpenTelemetry default. Grafana Cloud counts metrics in samples per
// minute, so production keeps it; local development can lower it.
const DEFAULT_METRIC_EXPORT_INTERVAL_MS = 60_000;

/**
 * Copies the OTEL_* variables from an env file into `env`, without
 * overriding variables that are already set.
 *
 * Nest's ConfigModule reads .env during bootstrap, which is too late for
 * OpenTelemetry: it has to start before the libraries it traces are loaded.
 * Only OTEL_* variables are copied, so everything else is still loaded by
 * ConfigModule, as before. The production image has no .env file.
 */
export function loadTelemetrySettings(path = '.env', env: NodeJS.ProcessEnv = process.env): void {
  if (!existsSync(path)) {
    return;
  }
  const fileVariables = parseEnv(readFileSync(path, 'utf8'));
  for (const [name, value] of Object.entries(fileVariables)) {
    if (name.startsWith('OTEL_') && env[name] === undefined) {
      env[name] = value;
    }
  }
}

/**
 * Starts OpenTelemetry when OTEL_EXPORTER_OTLP_ENDPOINT is set, and returns
 * the SDK so that it can be shut down. Without the variable, nothing starts
 * and undefined is returned: production stays unchanged until the variable is
 * added to its task definition.
 *
 * Traces, metrics and logs are sent over OTLP to that endpoint: locally to the
 * grafana/otel-lgtm container, in production to Grafana Cloud. The exporters
 * read the endpoint, and headers such as an API token, from the standard
 * OTEL_EXPORTER_OTLP_* variables themselves.
 */
export function startTelemetry(env: NodeJS.ProcessEnv = process.env): NodeSDK | undefined {
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return undefined;
  }

  const sdk = new NodeSDK({
    serviceName: env.OTEL_SERVICE_NAME ?? DEFAULT_SERVICE_NAME,
    traceExporter: new OTLPTraceExporter(),
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
        exportIntervalMillis:
          Number(env.OTEL_METRIC_EXPORT_INTERVAL) || DEFAULT_METRIC_EXPORT_INTERVAL_MS,
      }),
    ],
    // Log records from pino, sent once a second. They reach Loki next to the
    // traces, with the same trace_id.
    logRecordProcessors: [new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() })],
    instrumentations: [
      // Incoming and outgoing HTTP requests, including the http.server.request.duration
      // metric. The load balancer checks /health every few seconds; tracing those
      // checks would bury the real requests.
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => request.url?.startsWith('/health') ?? false,
      }),
      // Express middleware and routes, including better-auth on /api/auth/*.
      new ExpressInstrumentation(),
      // Nest controllers and handlers.
      new NestInstrumentation(),
      // Valkey commands: admin refresh tokens and the content cache.
      new IORedisInstrumentation(),
      // Prisma queries. Prisma runs them in its own engine, which the other
      // instrumentations cannot see.
      new PrismaInstrumentation(),
      // pino: adds trace_id and span_id of the current request to every log
      // line, and copies each line to the log record processor above.
      new PinoInstrumentation(),
    ],
  });
  sdk.start();
  return sdk;
}
