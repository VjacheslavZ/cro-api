import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    user: {
      findUnique: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
    },
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new UsersService(prisma as never);
  });

  describe('getProfile', () => {
    it('should return the profile for an existing user', async () => {
      prisma.user.findUnique.mock.mockImplementation(async () => ({
        id: 'user1',
        email: 'user@example.com',
        name: 'Ivan',
        avatarUrl: null,
        role: 'STUDENT',
        nativeLanguage: 'RU',
        xpTotal: 100,
        currentStreak: 3,
      }));

      const result = await service.getProfile('user1');

      assert.equal(result.id, 'user1');
      assert.equal(result.email, 'user@example.com');
      const callArgs = prisma.user.findUnique.mock.calls[0].arguments[0];
      assert.deepEqual(callArgs.where, { id: 'user1' });
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.getProfile('ghost'), {
        name: 'NotFoundException',
      });
    });
  });

  describe('updateProfile', () => {
    it('should update and return the profile with the given fields', async () => {
      const dto: UpdateUserDto = { name: 'New Name', nativeLanguage: 'UK' as never };
      prisma.user.update.mock.mockImplementation(async ({ data }: { data: UpdateUserDto }) => ({
        id: 'user1',
        email: 'user@example.com',
        name: data.name,
        avatarUrl: null,
        role: 'STUDENT',
        nativeLanguage: data.nativeLanguage,
        xpTotal: 50,
        currentStreak: 1,
      }));

      const result = await service.updateProfile('user1', dto);

      assert.equal(result.name, 'New Name');
      assert.equal(result.nativeLanguage, 'UK');
      const callArgs = prisma.user.update.mock.calls[0].arguments[0];
      assert.deepEqual(callArgs.where, { id: 'user1' });
      assert.deepEqual(callArgs.data, dto);
    });

    it('should handle an empty update payload', async () => {
      prisma.user.update.mock.mockImplementation(async () => ({
        id: 'user1',
        email: 'user@example.com',
        name: 'Existing Name',
        avatarUrl: null,
        role: 'STUDENT',
        nativeLanguage: 'RU',
        xpTotal: 50,
        currentStreak: 1,
      }));

      const result = await service.updateProfile('user1', {});

      assert.equal(result.name, 'Existing Name');
      const callArgs = prisma.user.update.mock.calls[0].arguments[0];
      assert.deepEqual(callArgs.data, {});
    });
  });

  describe('deleteAccount', () => {
    it('should delete the user by id', async () => {
      prisma.user.delete.mock.mockImplementation(async () => ({ id: 'user1' }));

      await service.deleteAccount('user1');

      assert.equal(prisma.user.delete.mock.callCount(), 1);
      const callArgs = prisma.user.delete.mock.calls[0].arguments[0];
      assert.deepEqual(callArgs.where, { id: 'user1' });
    });

    it('should propagate an error when the user does not exist', async () => {
      prisma.user.delete.mock.mockImplementation(async () => {
        throw new Error('Record to delete does not exist.');
      });

      await assert.rejects(() => service.deleteAccount('ghost'));
    });
  });
});
