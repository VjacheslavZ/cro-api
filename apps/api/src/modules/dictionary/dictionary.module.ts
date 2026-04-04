import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { GamificationModule } from '../gamification/gamification.module';
import { DictionaryController } from './dictionary.controller';
import { AdminDictionaryController } from './admin-dictionary.controller';
import { DictionaryService } from './dictionary.service';
import { DictionaryCollectionsService } from './dictionary-collections.service';
import { DictionaryPracticeService } from './dictionary-practice.service';

@Module({
  imports: [AuthModule, AdminAuthModule, GamificationModule],
  controllers: [DictionaryController, AdminDictionaryController],
  providers: [DictionaryService, DictionaryCollectionsService, DictionaryPracticeService],
})
export class DictionaryModule {}
