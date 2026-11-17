// main.ts imports this file before anything else. OpenTelemetry traces a
// library by patching it when it is loaded, so http, Express, Nest, ioredis
// and Prisma must be loaded after the SDK has started.
import { loadTelemetrySettings, startTelemetry } from './telemetry/telemetry';

loadTelemetrySettings();

export const telemetry = startTelemetry();
