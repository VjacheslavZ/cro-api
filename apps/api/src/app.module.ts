import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { envSchema } from './config/env.validation';
import { RateLimitModule } from './common/rate-limit.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContentModule } from './modules/content/content.module';
import { ProgressModule } from './modules/progress/progress.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { DictionaryModule } from './modules/dictionary/dictionary.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { HealthModule } from './modules/health/health.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    // Names each Sentry error after its route, e.g. "GET /content/topics/:id".
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    LoggingModule,
    RateLimitModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    AdminAuthModule,
    AdminModule,
    ContentModule,
    ProgressModule,
    GamificationModule,
    ExercisesModule,
    DictionaryModule,
    LessonsModule,
    HealthModule,
    TelemetryModule,
  ],
  providers: [
    // Sends unexpected errors to Sentry, then lets Nest answer as before: 500
    // and a log line with the stack. HttpExceptions (400, 401, 404...) are
    // expected and not sent. Without SENTRY_DSN it only passes errors on.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}
