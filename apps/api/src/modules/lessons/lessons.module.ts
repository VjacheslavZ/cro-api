import { Module } from '@nestjs/common';

import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuthModule } from '../auth/auth.module';
import { AdminLessonsController } from './admin-lessons.controller';
import { PublicLessonsController } from './public-lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  imports: [AdminAuthModule, AuthModule],
  controllers: [AdminLessonsController, PublicLessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
