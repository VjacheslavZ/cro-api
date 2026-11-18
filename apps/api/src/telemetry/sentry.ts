import * as Sentry from '@sentry/nestjs';

// Default Sentry integrations that only create spans in this API.
const SPAN_INTEGRATIONS = new Set(['Nest', 'Express']);

/**
 * What Sentry may attach to an error. Everything that can identify a user or
 * carry a secret is off: the session cookie and other headers, the OAuth
 * authorization code in the query string, request and response bodies
 * (passwords, answers), Prisma query parameters and the values of local
 * variables in the stack frames.
 */
export const ERROR_REPORT_DATA: NonNullable<Sentry.NodeOptions['dataCollection']> = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
};

/**
 * Starts Sentry error reporting when SENTRY_DSN is set, and returns the
 * client so that it can be flushed on shutdown. Without the variable, nothing
 * starts and undefined is returned: the API runs as before, and the Sentry
 * exception filter only passes errors on to Nest.
 *
 * Sentry receives only errors. Traces stay with OpenTelemetry: tracing is left
 * off here (no tracesSampleRate), and Sentry does not set up OpenTelemetry
 * itself. openTelemetryIntegration() reads the span that is active when an
 * error happens, so each Sentry error carries the trace_id of its request and
 * can be found in Tempo and Loki.
 *
 * Call it after startTelemetry(): Sentry links errors to the OpenTelemetry
 * setup that is already running.
 */
export function startErrorTracking(
  env: NodeJS.ProcessEnv = process.env,
): Sentry.NodeClient | undefined {
  if (!env.SENTRY_DSN) {
    return undefined;
  }

  return Sentry.init({
    dsn: env.SENTRY_DSN,
    // Separates local errors from production errors in the Sentry UI. The
    // production image sets NODE_ENV=production.
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV ?? 'development',
    // An error report needs the stack trace and the route, not who the user
    // is or what they sent. Sentry 11 collects most of this by default.
    dataCollection: ERROR_REPORT_DATA,
    enableOpenTelemetrySetup: false,
    integrations: (defaults) => [
      // Sentry's own spans for routes and requests carry their own trace_id,
      // which Sentry would put on the error in place of the OpenTelemetry one.
      // OpenTelemetry already traces Nest and Express.
      ...defaults.filter((integration) => !SPAN_INTEGRATIONS.has(integration.name)),
      // Request isolation only, without spans. OpenTelemetry already adds the
      // traceparent header to outgoing calls.
      Sentry.httpIntegration({ spans: false, tracePropagation: false }),
      Sentry.openTelemetryIntegration(),
    ],
  });
}
