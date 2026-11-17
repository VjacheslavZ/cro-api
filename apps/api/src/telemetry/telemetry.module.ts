import { Injectable, Module, OnApplicationShutdown } from '@nestjs/common';

import { telemetry } from '../instrumentation';

@Injectable()
export class TelemetryShutdown implements OnApplicationShutdown {
  // The SDK sends spans in batches and metrics once a minute. Shutting it down
  // sends what is still in memory, so a deploy loses nothing. Nest runs this
  // hook on SIGTERM because main.ts enables shutdown hooks.
  async onApplicationShutdown(): Promise<void> {
    await telemetry?.shutdown();
  }
}

@Module({ providers: [TelemetryShutdown] })
export class TelemetryModule {}
