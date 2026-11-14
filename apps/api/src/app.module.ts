import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
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
  ],
})
export class AppModule {}
