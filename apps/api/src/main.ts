import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { toNodeHandler } from 'better-auth/node';

import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { initAuth } from './auth';
import { logAddresses } from './common/log-addresses';

async function bootstrap() {
  // bodyParser: false so we can mount better-auth before any body parsing
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const configService = app.get(ConfigService);
  const webUrl = configService.get<string>('WEB_URL', 'http://localhost:5173');
  const adminUrl = configService.get<string>('ADMIN_URL', 'http://localhost:5174');
  const allowedOrigins = [webUrl, adminUrl];

  // CORS must be registered BEFORE the better-auth Express handler,
  // otherwise /api/auth/* routes bypass NestJS middleware entirely.
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' &&
          /^http:\/\/(localhost|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Croatian Grammar API')
    .setDescription('API for Croatian Grammar learning application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  logAddresses({ port, webUrl, adminUrl });
}

bootstrap();
