import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { MODULE_METADATA } from '@nestjs/common/constants';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AppModule } from './app.module';

describe('AppModule', () => {
  it('should apply ThrottlerGuard to every route', () => {
    const providers: unknown[] = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) ?? [];

    const hasGlobalThrottler = providers.some(
      (provider) =>
        typeof provider === 'object' &&
        provider !== null &&
        'provide' in provider &&
        'useClass' in provider &&
        provider.provide === APP_GUARD &&
        provider.useClass === ThrottlerGuard,
    );

    assert.ok(hasGlobalThrottler, 'ThrottlerGuard is not registered as APP_GUARD');
  });
});
