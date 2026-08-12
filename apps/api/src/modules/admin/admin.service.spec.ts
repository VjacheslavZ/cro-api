import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import * as bcrypt from 'bcrypt';

import { AdminService } from './admin.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    admin: {
      findUnique: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      findMany: mock.fn() as MockFn,
    },
  };
}

describe('AdminService', () => {
  let service: AdminService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AdminService(prisma as never);
  });

  describe('createAdmin', () => {
    it('should create an admin with a hashed password', async () => {
      prisma.admin.findUnique.mock.mockImplementation(async () => null);
      prisma.admin.create.mock.mockImplementation(
        async ({ data }: { data: { email: string; passwordHash: string } }) => ({
          id: 'admin1',
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: new Date('2026-01-01'),
        }),
      );

      const result = await service.createAdmin('new-admin@example.com', 'super-secret');

      assert.equal(result.id, 'admin1');
      assert.equal(result.email, 'new-admin@example.com');
      assert.equal(prisma.admin.create.mock.callCount(), 1);

      const createArgs = prisma.admin.create.mock.calls[0].arguments[0];
      assert.equal(createArgs.data.email, 'new-admin@example.com');
      assert.notEqual(createArgs.data.passwordHash, 'super-secret');
      const matches = await bcrypt.compare('super-secret', createArgs.data.passwordHash);
      assert.equal(matches, true);

      assert.equal((result as Record<string, unknown>).passwordHash, undefined);
    });

    it('should reject creating an admin with an existing email', async () => {
      prisma.admin.findUnique.mock.mockImplementation(async () => ({
        id: 'admin1',
        email: 'existing@example.com',
        passwordHash: 'hash',
      }));

      await assert.rejects(() => service.createAdmin('existing@example.com', 'whatever'), {
        name: 'ConflictException',
      });

      assert.equal(prisma.admin.create.mock.callCount(), 0);
    });
  });

  describe('listAdmins', () => {
    it('should return all admins ordered by createdAt ascending', async () => {
      prisma.admin.findMany.mock.mockImplementation(async () => [
        { id: 'admin1', email: 'a@example.com', createdAt: new Date('2026-01-01') },
        { id: 'admin2', email: 'b@example.com', createdAt: new Date('2026-01-02') },
      ]);

      const result = await service.listAdmins();

      assert.equal(result.length, 2);
      const callArgs = prisma.admin.findMany.mock.calls[0].arguments[0];
      assert.deepEqual(callArgs.orderBy, { createdAt: 'asc' });
      assert.deepEqual(callArgs.select, { id: true, email: true, createdAt: true });
    });

    it('should return an empty array when there are no admins', async () => {
      prisma.admin.findMany.mock.mockImplementation(async () => []);

      const result = await service.listAdmins();

      assert.equal(result.length, 0);
    });
  });
});
