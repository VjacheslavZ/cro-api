// Must stay the first import: OpenTelemetry has to start before the libraries
// it traces, so it is exempt from the usual import order.
// eslint-disable-next-line import-x/order
import { telemetry } from './instrumentation';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { toNodeHandler } from 'better-auth/node';

import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { initAuth } from './auth';
import { enableCors } from './common/cors';
import { logAddresses } from './common/log-addresses';
import { setupSwagger } from './common/swagger';
import { trustLoadBalancer } from './common/trust-load-balancer';

async function bootstrap() {
  // bodyParser: false so we can mount better-auth before any body parsing
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // In AWS every request comes through the ALB. Rate limiting counts requests
  // by req.ip, which must be the client's address, not the ALB's.
  trustLoadBalancer(app);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');
  const webUrl = configService.get<string>('WEB_URL', 'http://localhost:5173');
  const adminUrl = configService.get<string>('ADMIN_URL', 'http://localhost:5174');

  // CORS must be registered BEFORE the better-auth Express handler,
  // otherwise /api/auth/* routes bypass NestJS middleware entirely.
  enableCors(app, {
    origins: [webUrl, adminUrl],
    allowLocalNetwork: nodeEnv !== 'production',
  });

  const prisma = app.get(PrismaService);
  const auth = initAuth(prisma);

  const expressApp = app.getHttpAdapter().getInstance();

  // Mount better-auth handler BEFORE body parsing — it reads the body itself.
  // Express v5 requires named wildcards: *path
  expressApp.all('/api/auth/*path', toNodeHandler(auth));

  // Body parsing for all other routes.
  // When implementing Stripe webhooks, add raw body middleware for /payments/stripe/webhook.
  expressApp.use(json({ limit: '10mb' }));
  expressApp.use(urlencoded({ extended: true }));

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerEnabled = setupSwagger(app, nodeEnv);

  // Runs onModuleDestroy on SIGTERM, so a deploy closes connections cleanly.
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  // A link to Grafana only helps when the API is sending it data, and
  // production telemetry goes to Grafana Cloud, not to this address.
  const grafanaUrl =
    telemetry && nodeEnv !== 'production'
      ? configService.get<string>('GRAFANA_URL', 'http://localhost:3001')
      : undefined;
  // Printed for local development only: production logs need no infrastructure endpoints.
  const redisUrl =
    nodeEnv !== 'production' ? configService.getOrThrow<string>('REDIS_URL') : undefined;

  logAddresses({ port, webUrl, adminUrl, swaggerEnabled, grafanaUrl, redisUrl });
}

bootstrap();
