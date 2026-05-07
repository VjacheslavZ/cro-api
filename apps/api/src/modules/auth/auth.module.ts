import { Module } from '@nestjs/common';

import { BetterAuthGuard } from './guards/better-auth.guard';

@Module({
  providers: [BetterAuthGuard],
  exports: [BetterAuthGuard],
})
export class AuthModule {}
