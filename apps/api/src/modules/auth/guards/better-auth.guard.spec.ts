import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { BetterAuthGuard } from './better-auth.guard';
import * as authModule from '../../../auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    user: {
      findUnique: mock.fn() as MockFn,
    },
  };
}

function createContext() {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
  };
}

describe('BetterAuthGuard', () => {
  let guard: BetterAuthGuard;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    guard = new BetterAuthGuard(prisma as never);
  });

  it('should allow an active user with a valid session', async () => {
    mock.method(authModule, 'getAuth', () => ({
      api: {
        getSession: async () => ({ user: { id: 'user1' } }),
      },
    }));
    prisma.user.findUnique.mock.mockImplementation(async () => ({
      id: 'user1',
      email: 'user@example.com',
      role: 'STUDENT',
      isBlocked: false,
    }));

    const context = createContext();
    const result = await guard.canActivate(context as never);

    assert.equal(result, true);
  });

  it('should attach the resolved user to the request', async () => {
    mock.method(authModule, 'getAuth', () => ({
      api: {
        getSession: async () => ({ user: { id: 'user1' } }),
      },
    }));
    prisma.user.findUnique.mock.mockImplementation(async () => ({
      id: 'user1',
      email: 'user@example.com',
      role: 'STUDENT',
      isBlocked: false,
    }));

    const request: Record<string, unknown> = { headers: {} };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    await guard.canActivate(context as never);

    assert.deepEqual(request.user, { id: 'user1', email: 'user@example.com', role: 'STUDENT' });
  });

  it('should reject when there is no session', async () => {
    mock.method(authModule, 'getAuth', () => ({
      api: {
        getSession: async () => null,
      },
    }));

    await assert.rejects(() => guard.canActivate(createContext() as never), {
      name: 'UnauthorizedException',
    });
  });

  it('should reject when the session user no longer exists', async () => {
    mock.method(authModule, 'getAuth', () => ({
      api: {
        getSession: async () => ({ user: { id: 'ghost' } }),
      },
    }));
    prisma.user.findUnique.mock.mockImplementation(async () => null);

    await assert.rejects(() => guard.canActivate(createContext() as never), {
      name: 'UnauthorizedException',
    });
  });

  it('should reject a blocked user', async () => {
    mock.method(authModule, 'getAuth', () => ({
      api: {
        getSession: async () => ({ user: { id: 'user1' } }),
      },
    }));
    prisma.user.findUnique.mock.mockImplementation(async () => ({
      id: 'user1',
      email: 'user@example.com',
      role: 'STUDENT',
      isBlocked: true,
    }));

    await assert.rejects(() => guard.canActivate(createContext() as never), {
      name: 'UnauthorizedException',
    });
  });
});
