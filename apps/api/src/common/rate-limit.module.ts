import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

/** Requests each client may make per minute, unless a route sets its own limit with @Throttle. */
export const REQUESTS_PER_MINUTE = 100;

/**
 * Applies the rate limit to every route. ThrottlerModule only holds the
 * settings: without ThrottlerGuard registered as APP_GUARD, no limit applies
 * and @Throttle and @SkipThrottle have no effect. An APP_GUARD is global
 * whichever module provides it.
 */
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: REQUESTS_PER_MINUTE }])],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
