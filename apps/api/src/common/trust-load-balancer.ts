import type { INestApplication } from '@nestjs/common';
import type { Express } from 'express';

/**
 * Makes req.ip the client's address when the API runs behind one load balancer.
 *
 * Every request reaches the API from the load balancer, which appends the
 * address it received the request from to X-Forwarded-For. Trusting exactly
 * one hop makes Express take that last entry as req.ip. Entries a client puts
 * in X-Forwarded-For itself sit further left and are ignored, so a client
 * cannot choose the address that rate limiting counts it under.
 */
export function trustLoadBalancer(app: INestApplication): void {
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.set('trust proxy', 1);
}
