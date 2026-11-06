import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisHealthIndicator } from './redis.health';

const DATABASE_TIMEOUT_MS = 1000;

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redisIndicator: RedisHealthIndicator,
  ) {}

  // Checks no dependencies on purpose: restarting the API cannot fix a database or
  // Redis outage, so a load balancer must not remove instances because of one.
  @Get()
  @ApiOperation({ summary: 'Liveness: the process is running' })
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness: the database and Redis are reachable' })
  readiness() {
    return this.health.check([
      () =>
        this.prismaIndicator.pingCheck('database', this.prisma, { timeout: DATABASE_TIMEOUT_MS }),
      () => this.redisIndicator.pingCheck('redis'),
    ]);
  }
}
