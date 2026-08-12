import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { NativeLanguage } from '@cro/shared';

import { DictionaryService } from './dictionary.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    userDictionaryWord: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      findFirst: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      updateMany: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
      count: mock.fn() as MockFn,
      groupBy: mock.fn() as MockFn,
    },
    user: {
      findUnique: mock.fn() as MockFn,
    },
    dictionaryCollection: {
      findUnique: mock.fn() as MockFn,
    },
    predefinedDictionaryWord: {
      findMany: mock.fn() as MockFn,
    },
    dictionaryWordProgress: {
      upsert: mock.fn() as MockFn,
    },
    $transaction: mock.fn() as MockFn,
  };
}

function createMockConfigService() {
  const values: Record<string, unknown> = {
    OLLAMA_URL: 'http://localhost:11434',
    OLLAMA_MODEL: 'llama3',
  };
  return {
    get: mock.fn((key: string) => values[key]) as MockFn,
  };
}

function createMockReviewService() {
  return {
    seedIfLearned: mock.fn() as MockFn,
  };
}

describe('DictionaryService', () => {
  let service: DictionaryService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let config: ReturnType<typeof createMockConfigService>;
  let reviewService: ReturnType<typeof createMockReviewService>;

  beforeEach(() => {
    prisma = createMockPrisma();
    config = createMockConfigService();
    reviewService = createMockReviewService();
    service = new DictionaryService(prisma as never, config as never, reviewService as never);
  });

  describe('getWords', () => {
    it('should return items with derived language and no next cursor when under a page', async () => {
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => [
        {
          id: 'w1',
          wordHr: 'kruh',
          translation: 'bread',
          translationLanguage: 'EN',
          collectionId: null,
          collection: null,
          progress: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ]);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 1);
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'EN' }));

      const result = await service.getWords('user1', { limit: 20 } as never);

      assert.equal(result.items.length, 1);
      assert.equal(result.nextCursor, null);
      assert.equal(result.total, 1);
      assert.equal(result.items[0].isLearned, false);
      assert.equal(result.items[0].progressPercent, 0);
    });

    it('should return nextCursor when more items exist than the page limit', async () => {
      const makeWord = (id: string) => ({
        id,
        wordHr: `word-${id}`,
        translation: `trans-${id}`,
        translationLanguage: 'EN',
        collectionId: null,
        collection: null,
        progress: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      });
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => [
        makeWord('w1'),
        makeWord('w2'),
        makeWord('w3'),
      ]);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 10);
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'EN' }));

      const result = await service.getWords('user1', { limit: 2 } as never);

      assert.equal(result.items.length, 2);
      assert.equal(result.nextCursor, 'w2');
      const findManyArgs = prisma.userDictionaryWord.findMany.mock.calls[0].arguments[0];
      assert.equal(findManyArgs.take, 3);
    });

    it('should pass cursor with skip:1 for db-sortable queries', async () => {
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => []);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 0);
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'EN' }));

      await service.getWords('user1', { limit: 20, cursor: 'w1' } as never);

      const findManyArgs = prisma.userDictionaryWord.findMany.mock.calls[0].arguments[0];
      assert.deepEqual(findManyArgs.cursor, { id: 'w1' });
      assert.equal(findManyArgs.skip, 1);
    });

    it('should default to EN when user is not found', async () => {
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => [
        {
          id: 'w1',
          wordHr: 'kruh',
          translation: 'bread',
          translationLanguage: 'EN',
          collectionId: 'c1',
          collection: { personalName: 'My Words', nameRu: '', nameUk: '', nameEn: '' },
          progress: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ]);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 1);
      prisma.user.findUnique.mock.mockImplementation(async () => null);

      const result = await service.getWords('user1', { limit: 20 } as never);

      assert.equal(result.items[0].collectionName, 'My Words');
    });

    it('should resolve collection name by native language with fallback', async () => {
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => [
        {
          id: 'w1',
          wordHr: 'kruh',
          translation: 'хлеб',
          translationLanguage: 'RU',
          collectionId: 'c1',
          collection: { personalName: 'Fallback', nameRu: '', nameUk: 'Хліб', nameEn: 'Bread' },
          progress: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ]);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 1);
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'RU' }));

      const result = await service.getWords('user1', { limit: 20 } as never);

      assert.equal(result.items[0].collectionName, 'Bread');
    });

    it('should mark word as learned when all progress percents are 100', async () => {
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => [
        {
          id: 'w1',
          wordHr: 'kruh',
          translation: 'bread',
          translationLanguage: 'EN',
          collectionId: null,
          collection: null,
          progress: {
            totalAttempts: 4,
            correctAttempts: 4,
            wordToTranslatePercent: 100,
            translateToWordPercent: 100,
            letterPickPercent: 100,
            matchingPercent: 100,
          },
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ]);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 1);
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'EN' }));

      const result = await service.getWords('user1', { limit: 20 } as never);

      assert.equal(result.items[0].isLearned, true);
      assert.equal(result.items[0].progressPercent, 100);
    });

    it('should sort by progress in JS and paginate with cursor', async () => {
      const makeWord = (id: string, percent: number) => ({
        id,
        wordHr: id,
        translation: id,
        translationLanguage: 'EN',
        collectionId: null,
        collection: null,
        progress: {
          totalAttempts: 0,
          correctAttempts: 0,
          wordToTranslatePercent: percent,
          translateToWordPercent: percent,
          letterPickPercent: percent,
          matchingPercent: percent,
        },
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      });
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => [
        makeWord('w3', 60),
        makeWord('w1', 10),
        makeWord('w2', 30),
      ]);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 3);
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'EN' }));

      const result = await service.getWords('user1', { limit: 20, sort: 'progress' } as never);

      assert.deepEqual(
        result.items.map((i) => i.id),
        ['w1', 'w2', 'w3'],
      );
      const findManyArgs = prisma.userDictionaryWord.findMany.mock.calls[0].arguments[0];
      assert.equal(findManyArgs.orderBy, undefined);
      assert.equal(findManyArgs.take, undefined);
    });

    it('should paginate JS-sorted results using cursor position', async () => {
      const makeWord = (id: string, percent: number) => ({
        id,
        wordHr: id,
        translation: id,
        translationLanguage: 'EN',
        collectionId: null,
        collection: null,
        progress: {
          totalAttempts: 0,
          correctAttempts: 0,
          wordToTranslatePercent: percent,
          translateToWordPercent: percent,
          letterPickPercent: percent,
          matchingPercent: percent,
        },
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      });
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => [
        makeWord('w1', 10),
        makeWord('w2', 30),
        makeWord('w3', 60),
      ]);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 3);
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'EN' }));

      const result = await service.getWords('user1', {
        limit: 1,
        sort: 'progress',
        cursor: 'w1',
      } as never);

      assert.deepEqual(
        result.items.map((i) => i.id),
        ['w2'],
      );
      assert.equal(result.nextCursor, 'w2');
    });

    it('should filter using search, collectionId, and excludeLearned in the where clause', async () => {
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => []);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 0);
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'EN' }));

      await service.getWords('user1', {
        limit: 20,
        search: 'kruh',
        collectionId: 'c1',
        excludeLearned: true,
      } as never);

      const findManyArgs = prisma.userDictionaryWord.findMany.mock.calls[0].arguments[0];
      assert.equal(findManyArgs.where.userId, 'user1');
      assert.equal(findManyArgs.where.collectionId, 'c1');
      assert.ok(findManyArgs.where.OR);
      assert.ok(findManyArgs.where.NOT);
    });

    it('should return empty items when the user has no words', async () => {
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => []);
      prisma.userDictionaryWord.count.mock.mockImplementation(async () => 0);
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'EN' }));

      const result = await service.getWords('user1', { limit: 20 } as never);

      assert.equal(result.items.length, 0);
      assert.equal(result.nextCursor, null);
      assert.equal(result.total, 0);
    });
  });

  describe('addWord', () => {
    it('should derive translationLanguage from the passed nativeLanguage, ignoring client input', async () => {
      prisma.userDictionaryWord.findFirst.mock.mockImplementation(async () => null);
      prisma.userDictionaryWord.create.mock.mockImplementation(async (args: never) => args);

      const dto = { wordHr: 'kruh', translation: 'bread' } as never;
      await service.addWord('user1', dto, NativeLanguage.RU);

      const createArgs = prisma.userDictionaryWord.create.mock.calls[0].arguments[0];
      assert.equal(createArgs.data.translationLanguage, NativeLanguage.RU);
      assert.equal(createArgs.data.userId, 'user1');
      assert.equal(createArgs.data.collectionId, null);
    });

    it('should validate collection access when a collectionId is provided', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: true,
        createdByUserId: null,
      }));
      prisma.userDictionaryWord.findFirst.mock.mockImplementation(async () => null);
      prisma.userDictionaryWord.create.mock.mockImplementation(async (args: never) => args);

      const dto = { wordHr: 'kruh', translation: 'bread', collectionId: 'c1' } as never;
      await service.addWord('user1', dto, NativeLanguage.EN);

      assert.equal(prisma.dictionaryCollection.findUnique.mock.callCount(), 1);
      const createArgs = prisma.userDictionaryWord.create.mock.calls[0].arguments[0];
      assert.equal(createArgs.data.collectionId, 'c1');
    });

    it('should throw NotFoundException when the collection does not exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      const dto = { wordHr: 'kruh', translation: 'bread', collectionId: 'missing' } as never;
      await assert.rejects(() => service.addWord('user1', dto, NativeLanguage.EN), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when the collection is private and not owned by the user', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: false,
        createdByUserId: 'other-user',
      }));

      const dto = { wordHr: 'kruh', translation: 'bread', collectionId: 'c1' } as never;
      await assert.rejects(() => service.addWord('user1', dto, NativeLanguage.EN), {
        name: 'ForbiddenException',
      });
    });

    it('should throw ConflictException when the word already exists (case-insensitive)', async () => {
      prisma.userDictionaryWord.findFirst.mock.mockImplementation(async () => ({ id: 'existing' }));

      const dto = { wordHr: 'Kruh', translation: 'bread' } as never;
      await assert.rejects(() => service.addWord('user1', dto, NativeLanguage.EN), {
        name: 'ConflictException',
      });
      assert.equal(prisma.userDictionaryWord.create.mock.callCount(), 0);
    });
  });

  describe('updateWord', () => {
    it('should update wordHr and translation for the owning user', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.userDictionaryWord.findFirst.mock.mockImplementation(async () => null);
      prisma.userDictionaryWord.update.mock.mockImplementation(async (args: never) => args);

      const dto = { wordHr: 'novo', translation: 'new' } as never;
      await service.updateWord('user1', 'w1', dto);

      const updateArgs = prisma.userDictionaryWord.update.mock.calls[0].arguments[0];
      assert.equal(updateArgs.data.wordHr, 'novo');
      assert.equal(updateArgs.data.translation, 'new');
    });

    it('should throw NotFoundException when the word does not exist', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.updateWord('user1', 'missing', {} as never), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when the word belongs to another user', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'other-user',
      }));

      await assert.rejects(() => service.updateWord('user1', 'w1', {} as never), {
        name: 'ForbiddenException',
      });
    });

    it('should throw ConflictException on duplicate wordHr excluding itself', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.userDictionaryWord.findFirst.mock.mockImplementation(async () => ({ id: 'w2' }));

      const dto = { wordHr: 'duplicate' } as never;
      await assert.rejects(() => service.updateWord('user1', 'w1', dto), {
        name: 'ConflictException',
      });
      const findFirstArgs = prisma.userDictionaryWord.findFirst.mock.calls[0].arguments[0];
      assert.deepEqual(findFirstArgs.where.NOT, { id: 'w1' });
    });

    it('should not check for duplicates when wordHr is not provided', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.userDictionaryWord.update.mock.mockImplementation(async (args: never) => args);

      await service.updateWord('user1', 'w1', { translation: 'only-translation' } as never);

      assert.equal(prisma.userDictionaryWord.findFirst.mock.callCount(), 0);
    });
  });

  describe('resetWordProgress', () => {
    it('should reset progress fields to zero for the owning user', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.dictionaryWordProgress.upsert.mock.mockImplementation(async () => ({}));

      await service.resetWordProgress('user1', 'w1');

      const upsertArgs = prisma.dictionaryWordProgress.upsert.mock.calls[0].arguments[0];
      assert.equal(upsertArgs.update.wordToTranslatePercent, 0);
      assert.equal(upsertArgs.update.totalAttempts, 0);
    });

    it('should throw NotFoundException when the word does not exist', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.resetWordProgress('user1', 'missing'), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when the word belongs to another user', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'other-user',
      }));

      await assert.rejects(() => service.resetWordProgress('user1', 'w1'), {
        name: 'ForbiddenException',
      });
    });
  });

  describe('markWordAsLearned', () => {
    it('should set all progress percents to 100 and seed the review card', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.dictionaryWordProgress.upsert.mock.mockImplementation(async () => ({}));
      reviewService.seedIfLearned.mock.mockImplementation(async () => undefined);

      await service.markWordAsLearned('user1', 'w1');

      const upsertArgs = prisma.dictionaryWordProgress.upsert.mock.calls[0].arguments[0];
      assert.equal(upsertArgs.update.matchingPercent, 100);
      assert.equal(reviewService.seedIfLearned.mock.callCount(), 1);
      assert.deepEqual(reviewService.seedIfLearned.mock.calls[0].arguments, ['user1', 'w1']);
    });

    it('should throw NotFoundException when the word does not exist', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.markWordAsLearned('user1', 'missing'), {
        name: 'NotFoundException',
      });
      assert.equal(reviewService.seedIfLearned.mock.callCount(), 0);
    });

    it('should throw ForbiddenException when the word belongs to another user', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'other-user',
      }));

      await assert.rejects(() => service.markWordAsLearned('user1', 'w1'), {
        name: 'ForbiddenException',
      });
    });
  });

  describe('deleteWord', () => {
    it('should delete the word for the owning user', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.userDictionaryWord.delete.mock.mockImplementation(async () => ({}));

      await service.deleteWord('user1', 'w1');

      assert.equal(prisma.userDictionaryWord.delete.mock.callCount(), 1);
      assert.deepEqual(prisma.userDictionaryWord.delete.mock.calls[0].arguments[0], {
        where: { id: 'w1' },
      });
    });

    it('should throw NotFoundException when the word does not exist', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.deleteWord('user1', 'missing'), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when the word belongs to another user', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'other-user',
      }));

      await assert.rejects(() => service.deleteWord('user1', 'w1'), {
        name: 'ForbiddenException',
      });
      assert.equal(prisma.userDictionaryWord.delete.mock.callCount(), 0);
    });
  });

  describe('assignCollection', () => {
    it('should assign a valid collection to the word', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: true,
        createdByUserId: null,
      }));
      prisma.userDictionaryWord.update.mock.mockImplementation(async (args: never) => args);

      await service.assignCollection('user1', 'w1', 'c1');

      const updateArgs = prisma.userDictionaryWord.update.mock.calls[0].arguments[0];
      assert.equal(updateArgs.data.collectionId, 'c1');
    });

    it('should unassign (set null) instead of deleting the word when collectionId is null', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.userDictionaryWord.update.mock.mockImplementation(async (args: never) => args);

      await service.assignCollection('user1', 'w1', null);

      assert.equal(prisma.dictionaryCollection.findUnique.mock.callCount(), 0);
      const updateArgs = prisma.userDictionaryWord.update.mock.calls[0].arguments[0];
      assert.equal(updateArgs.data.collectionId, null);
      assert.equal(prisma.userDictionaryWord.delete.mock.callCount(), 0);
    });

    it('should throw NotFoundException when the word does not exist', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.assignCollection('user1', 'missing', 'c1'), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when the word belongs to another user', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'other-user',
      }));

      await assert.rejects(() => service.assignCollection('user1', 'w1', 'c1'), {
        name: 'ForbiddenException',
      });
    });

    it('should throw NotFoundException when the target collection does not exist', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.assignCollection('user1', 'w1', 'missing-collection'), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when the target collection is private and not owned by user', async () => {
      prisma.userDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        userId: 'user1',
      }));
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: false,
        createdByUserId: 'other-user',
      }));

      await assert.rejects(() => service.assignCollection('user1', 'w1', 'c1'), {
        name: 'ForbiddenException',
      });
    });
  });

  describe('batchAssignCollection', () => {
    it('should validate collection access before updating many words', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: true,
        createdByUserId: null,
      }));
      prisma.userDictionaryWord.updateMany.mock.mockImplementation(async () => ({ count: 2 }));

      await service.batchAssignCollection('user1', ['w1', 'w2'], 'c1');

      const updateManyArgs = prisma.userDictionaryWord.updateMany.mock.calls[0].arguments[0];
      assert.deepEqual(updateManyArgs.where, { id: { in: ['w1', 'w2'] }, userId: 'user1' });
      assert.equal(updateManyArgs.data.collectionId, 'c1');
    });

    it('should unassign words from their collection when collectionId is null', async () => {
      prisma.userDictionaryWord.updateMany.mock.mockImplementation(async () => ({ count: 2 }));

      await service.batchAssignCollection('user1', ['w1', 'w2'], null);

      assert.equal(prisma.dictionaryCollection.findUnique.mock.callCount(), 0);
      const updateManyArgs = prisma.userDictionaryWord.updateMany.mock.calls[0].arguments[0];
      assert.equal(updateManyArgs.data.collectionId, null);
    });

    it('should throw NotFoundException when the target collection does not exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.batchAssignCollection('user1', ['w1'], 'missing'), {
        name: 'NotFoundException',
      });
      assert.equal(prisma.userDictionaryWord.updateMany.mock.callCount(), 0);
    });

    it('should do nothing meaningful with an empty wordIds array besides calling updateMany', async () => {
      prisma.userDictionaryWord.updateMany.mock.mockImplementation(async () => ({ count: 0 }));

      await service.batchAssignCollection('user1', [], null);

      const updateManyArgs = prisma.userDictionaryWord.updateMany.mock.calls[0].arguments[0];
      assert.deepEqual(updateManyArgs.where.id.in, []);
    });
  });

  describe('getSuggestions', () => {
    it('should filter by wordHr and the given language, ordered by popularity, capped at 5', async () => {
      prisma.userDictionaryWord.groupBy.mock.mockImplementation(async () => [
        { translation: 'bread', _count: { translation: 8 } },
        { translation: 'loaf', _count: { translation: 3 } },
      ]);

      const result = await service.getSuggestions('kruh', NativeLanguage.EN);

      const groupByArgs = prisma.userDictionaryWord.groupBy.mock.calls[0].arguments[0];
      assert.deepEqual(groupByArgs.where, {
        wordHr: 'kruh',
        translationLanguage: NativeLanguage.EN,
      });
      assert.deepEqual(groupByArgs.orderBy, { _count: { translation: 'desc' } });
      assert.equal(groupByArgs.take, 5);
      assert.deepEqual(result, [
        { translation: 'bread', count: 8 },
        { translation: 'loaf', count: 3 },
      ]);
    });

    it('should return an empty array when there are no matching translations', async () => {
      prisma.userDictionaryWord.groupBy.mock.mockImplementation(async () => []);

      const result = await service.getSuggestions('unknown', NativeLanguage.RU);

      assert.deepEqual(result, []);
    });
  });

  describe('addSet', () => {
    it('should throw NotFoundException when the collection is missing', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.addSet('user1', 'missing-collection', NativeLanguage.EN), {
        name: 'NotFoundException',
      });
    });

    it('should throw NotFoundException when the collection is not public', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: false,
      }));

      await assert.rejects(() => service.addSet('user1', 'c1', NativeLanguage.EN), {
        name: 'NotFoundException',
      });
    });

    it('should return zero counts when the collection has no predefined words', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: true,
      }));
      prisma.predefinedDictionaryWord.findMany.mock.mockImplementation(async () => []);

      const result = await service.addSet('user1', 'c1', NativeLanguage.EN);

      assert.deepEqual(result, { addedCount: 0, skippedCount: 0 });
    });

    it('should skip words the user already has and add only new ones', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: true,
      }));
      prisma.predefinedDictionaryWord.findMany.mock.mockImplementation(async () => [
        { wordHr: 'kruh', translationRu: 'хлеб', translationUk: 'хліб', translationEn: 'bread' },
        { wordHr: 'voda', translationRu: 'вода', translationUk: 'вода', translationEn: 'water' },
      ]);
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => [{ wordHr: 'kruh' }]);
      const tx = { userDictionaryWord: { create: mock.fn() as MockFn } };
      prisma.$transaction.mock.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
        await cb(tx);
      });

      const result = await service.addSet('user1', 'c1', NativeLanguage.RU);

      assert.deepEqual(result, { addedCount: 1, skippedCount: 1 });
      assert.equal(tx.userDictionaryWord.create.mock.callCount(), 1);
      const createArgs = tx.userDictionaryWord.create.mock.calls[0].arguments[0];
      assert.equal(createArgs.data.wordHr, 'voda');
      assert.equal(createArgs.data.translation, 'вода');
      assert.equal(createArgs.data.translationLanguage, NativeLanguage.RU);
      assert.equal(createArgs.data.collectionId, 'c1');
    });

    it('should return zero addedCount and full skippedCount when all words already exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: true,
      }));
      prisma.predefinedDictionaryWord.findMany.mock.mockImplementation(async () => [
        { wordHr: 'kruh', translationRu: 'хлеб', translationUk: 'хліб', translationEn: 'bread' },
      ]);
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => [{ wordHr: 'kruh' }]);

      const result = await service.addSet('user1', 'c1', NativeLanguage.EN);

      assert.deepEqual(result, { addedCount: 0, skippedCount: 1 });
      assert.equal(prisma.$transaction.mock.callCount(), 0);
    });

    it('should filter predefined words by wordIds when provided', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'c1',
        isPublic: true,
      }));
      prisma.predefinedDictionaryWord.findMany.mock.mockImplementation(async () => []);

      await service.addSet('user1', 'c1', NativeLanguage.EN, ['pw1', 'pw2']);

      const findManyArgs = prisma.predefinedDictionaryWord.findMany.mock.calls[0].arguments[0];
      assert.deepEqual(findManyArgs.where.id, { in: ['pw1', 'pw2'] });
    });
  });
});
