import { Injectable, Module, OnApplicationShutdown } from '@nestjs/common';

import { errorTracking, telemetry } from '../instrumentation';

// How long a shutdown waits for Sentry to send the errors it still holds.
const SENTRY_FLUSH_TIMEOUT_MS = 2_000;

@Injectable()
export class TelemetryShutdown implements OnApplicationShutdown {
  // The SDK sends spans in batches and metrics once a minute, and Sentry sends
  // errors in the background. Shutting them down sends what is still in
  // memory, so a deploy loses nothing. Nest runs this hook on SIGTERM because
  // main.ts enables shutdown hooks.
  async onApplicationShutdown(): Promise<void> {
    await Promise.all([telemetry?.shutdown(), errorTracking?.close(SENTRY_FLUSH_TIMEOUT_MS)]);
  }
}

@Module({ providers: [TelemetryShutdown] })
export class TelemetryModule {}
