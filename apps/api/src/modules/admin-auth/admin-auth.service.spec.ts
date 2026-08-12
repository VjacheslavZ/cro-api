import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

import { AdminAuthService } from './admin-auth.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    admin: {
      findUnique: mock.fn() as MockFn,
    },
  };
}

function createMockJwtService() {
  return {
    sign: mock.fn() as MockFn,
    verify: mock.fn() as MockFn,
  };
}

function createMockConfigService() {
  const values: Record<string, unknown> = {
    REDIS_URL: 'redis://localhost:1',
    JWT_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_ACCESS_EXPIRY_SECONDS: 900,
    JWT_REFRESH_EXPIRY_SECONDS: 2592000,
  };
  return {
    get: mock.fn((key: string, fallback?: unknown) => values[key] ?? fallback) as MockFn,
  };
}

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(() => {
    // Prevent the service's internal `new Redis(...)` from opening a real socket.
    mock.method(Redis.prototype, 'connect', async () => undefined as unknown as void);
    mock.method(Redis.prototype, 'get', async () => null);
    mock.method(Redis.prototype, 'set', async () => 'OK');
    mock.method(Redis.prototype, 'del', async () => 1);

    prisma = createMockPrisma();
    jwtService = createMockJwtService();
    configService = createMockConfigService();
    service = new AdminAuthService(prisma as never, jwtService as never, configService as never);
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prisma.admin.findUnique.mock.mockImplementation(async () => ({
        id: 'admin1',
        email: 'admin@example.com',
        passwordHash,
      }));
      jwtService.sign.mock.mockImplementation(() => 'signed-token');

      const result = await service.login('admin@example.com', 'correct-password');

      assert.equal(result.accessToken, 'signed-token');
      assert.equal(result.refreshToken, 'signed-token');
      assert.equal(result.admin.id, 'admin1');
      assert.equal(result.admin.email, 'admin@example.com');
    });

    it('should reject an unknown email', async () => {
      prisma.admin.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.login('nobody@example.com', 'whatever'), {
        name: 'UnauthorizedException',
      });
    });

    it('should reject an incorrect password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prisma.admin.findUnique.mock.mockImplementation(async () => ({
        id: 'admin1',
        email: 'admin@example.com',
        passwordHash,
      }));

      await assert.rejects(() => service.login('admin@example.com', 'wrong-password'), {
        name: 'UnauthorizedException',
      });
    });
  });

  describe('refreshTokens', () => {
    it('should issue new tokens for a valid, stored refresh token', async () => {
      jwtService.verify.mock.mockImplementation(() => ({
        sub: 'admin1',
        email: 'admin@example.com',
        type: 'admin',
        tokenId: 'token1',
      }));
      mock.method(Redis.prototype, 'get', async () => '1');
      jwtService.sign.mock.mockImplementation(() => 'new-token');

      const result = await service.refreshTokens('valid-refresh-token');

      assert.equal(result.accessToken, 'new-token');
      assert.equal(result.refreshToken, 'new-token');
    });

    it('should reject a malformed refresh token', async () => {
      jwtService.verify.mock.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await assert.rejects(() => service.refreshTokens('garbage'), {
        name: 'UnauthorizedException',
      });
    });

    it('should reject a token that is not of type admin', async () => {
      jwtService.verify.mock.mockImplementation(() => ({
        sub: 'user1',
        email: 'user@example.com',
        type: 'student',
        tokenId: 'token1',
      }));

      await assert.rejects(() => service.refreshTokens('student-token'), {
        name: 'UnauthorizedException',
      });
    });

    it('should reject a revoked refresh token', async () => {
      jwtService.verify.mock.mockImplementation(() => ({
        sub: 'admin1',
        email: 'admin@example.com',
        type: 'admin',
        tokenId: 'token1',
      }));
      mock.method(Redis.prototype, 'get', async () => null);

      await assert.rejects(() => service.refreshTokens('revoked-token'), {
        name: 'UnauthorizedException',
      });
    });
  });

  describe('logout', () => {
    it('should not throw when the refresh token is already invalid', async () => {
      jwtService.verify.mock.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await assert.doesNotReject(() => service.logout('admin1', 'garbage'));
    });

    it('should delete the stored refresh token on valid logout', async () => {
      jwtService.verify.mock.mockImplementation(() => ({
        sub: 'admin1',
        tokenId: 'token1',
      }));
      const delMock = mock.method(Redis.prototype, 'del', async () => 1);

      await service.logout('admin1', 'valid-refresh-token');

      assert.equal(delMock.mock.callCount() > 0, true);
    });
  });
});
