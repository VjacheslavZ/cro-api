import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis';

const REDIS_TIMEOUT_MS = 1000;

@Injectable()
export class RedisHealthIndicator implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    configService: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {
    this.redis = new Redis(configService.get<string>('REDIS_URL')!, {
      lazyConnect: true,
      connectTimeout: REDIS_TIMEOUT_MS,
      commandTimeout: REDIS_TIMEOUT_MS,
      maxRetriesPerRequest: 1,
    });
    // Failures are reported through pingCheck, so connection errors need no logging here.
    this.redis.on('error', () => undefined);
  }

  async pingCheck<Key extends string>(key: Key): Promise<HealthIndicatorResult<Key>> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.redis.ping();
      return indicator.up();
    } catch {
      return indicator.down();
    }
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
