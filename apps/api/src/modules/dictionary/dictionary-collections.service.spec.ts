import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { DictionaryCollectionsService } from './dictionary-collections.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    user: {
      findUnique: mock.fn() as MockFn,
    },
    dictionaryCollection: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
    },
    predefinedDictionaryWord: {
      findMany: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
    },
  };
}

describe('DictionaryCollectionsService', () => {
  let service: DictionaryCollectionsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DictionaryCollectionsService(prisma as never);
  });

  describe('getCollections', () => {
    it('should merge public and personal collections localized by user language', async () => {
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'RU' }));
      prisma.dictionaryCollection.findMany.mock.mockImplementationOnce(
        async () => [
          {
            id: 'pub1',
            nameRu: 'Публичная',
            nameUk: 'Публічна',
            nameEn: 'Public',
            description: null,
            isPublic: true,
            words: [{ id: 'w1' }],
            _count: { predefinedWords: 5 },
          },
        ],
        0,
      );
      prisma.dictionaryCollection.findMany.mock.mockImplementationOnce(
        async () => [
          {
            id: 'personal1',
            personalName: 'My words',
            description: 'desc',
            isPublic: false,
            _count: { words: 3 },
          },
        ],
        1,
      );

      const result = await service.getCollections('user1');

      assert.equal(result.length, 2);
      assert.equal(result[0].name, 'Публичная');
      assert.equal(result[0].wordCount, 1);
      assert.equal(result[0].type, 'predefined');
      assert.equal(result[1].name, 'My words');
      assert.equal(result[1].wordCount, 3);
      assert.equal(result[1].type, 'personal');
    });

    it('should fall back to English name when nativeLanguage translation missing', async () => {
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'UK' }));
      prisma.dictionaryCollection.findMany.mock.mockImplementationOnce(
        async () => [
          {
            id: 'pub1',
            nameRu: 'Публичная',
            nameUk: '',
            nameEn: 'Public',
            description: null,
            isPublic: true,
            words: [],
            _count: { predefinedWords: 0 },
          },
        ],
        0,
      );
      prisma.dictionaryCollection.findMany.mock.mockImplementationOnce(async () => [], 1);

      const result = await service.getCollections('user1');

      assert.equal(result[0].name, 'Public');
    });

    it('should default to EN when user not found', async () => {
      prisma.user.findUnique.mock.mockImplementation(async () => null);
      prisma.dictionaryCollection.findMany.mock.mockImplementationOnce(
        async () => [
          {
            id: 'pub1',
            nameRu: 'Публичная',
            nameUk: 'Публічна',
            nameEn: 'Public',
            description: null,
            isPublic: true,
            words: [],
            _count: { predefinedWords: 0 },
          },
        ],
        0,
      );
      prisma.dictionaryCollection.findMany.mock.mockImplementationOnce(async () => [], 1);

      const result = await service.getCollections('user1');

      assert.equal(result[0].name, 'Public');
    });

    it('should return empty array when no collections exist', async () => {
      prisma.user.findUnique.mock.mockImplementation(async () => ({ nativeLanguage: 'EN' }));
      prisma.dictionaryCollection.findMany.mock.mockImplementationOnce(async () => [], 0);
      prisma.dictionaryCollection.findMany.mock.mockImplementationOnce(async () => [], 1);

      const result = await service.getCollections('user1');

      assert.deepEqual(result, []);
    });
  });

  describe('getCollectionWords', () => {
    it('should return words for a public collection', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: true,
      }));
      prisma.predefinedDictionaryWord.findMany.mock.mockImplementation(async () => [
        { id: 'w1', wordHr: 'kruh' },
      ]);

      const result = await service.getCollectionWords('col1');

      assert.equal(result.length, 1);
    });

    it('should throw NotFoundException when collection does not exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.getCollectionWords('missing'), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when collection is not public', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: false,
      }));

      await assert.rejects(() => service.getCollectionWords('col1'), {
        name: 'ForbiddenException',
      });
    });
  });

  describe('createCollection', () => {
    it('should create a personal collection with zero word count', async () => {
      prisma.dictionaryCollection.create.mock.mockImplementation(async () => ({
        id: 'col1',
        personalName: 'My words',
        description: 'desc',
        createdByUserId: 'user1',
        isPublic: false,
      }));

      const result = await service.createCollection('user1', {
        name: 'My words',
        description: 'desc',
      });

      assert.equal(prisma.dictionaryCollection.create.mock.callCount(), 1);
      const args = prisma.dictionaryCollection.create.mock.calls[0].arguments[0];
      assert.equal(args.data.personalName, 'My words');
      assert.equal(args.data.isPublic, false);
      assert.equal(result.wordCount, 0);
      assert.equal(result.type, 'personal');
    });
  });

  describe('updateCollection', () => {
    it('should update a collection owned by the user', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        createdByUserId: 'user1',
      }));
      prisma.dictionaryCollection.update.mock.mockImplementation(async () => ({
        id: 'col1',
        personalName: 'Updated',
      }));

      const result = await service.updateCollection('user1', 'col1', { name: 'Updated' });

      assert.equal(result.personalName, 'Updated');
    });

    it('should throw NotFoundException when collection does not exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.updateCollection('user1', 'missing', {}), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when user does not own the collection', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        createdByUserId: 'otherUser',
      }));

      await assert.rejects(() => service.updateCollection('user1', 'col1', {}), {
        name: 'ForbiddenException',
      });
    });
  });

  describe('deleteCollection', () => {
    it('should delete a collection owned by the user', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        createdByUserId: 'user1',
      }));
      prisma.dictionaryCollection.delete.mock.mockImplementation(async () => ({}));

      await service.deleteCollection('user1', 'col1');

      assert.equal(prisma.dictionaryCollection.delete.mock.callCount(), 1);
    });

    it('should throw NotFoundException when collection does not exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.deleteCollection('user1', 'missing'), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when user does not own the collection', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        createdByUserId: 'otherUser',
      }));

      await assert.rejects(() => service.deleteCollection('user1', 'col1'), {
        name: 'ForbiddenException',
      });
    });
  });

  describe('adminGetCollections', () => {
    it('should return public collections with word counts', async () => {
      prisma.dictionaryCollection.findMany.mock.mockImplementation(async () => [
        {
          id: 'col1',
          nameRu: 'A',
          nameUk: 'B',
          nameEn: 'C',
          description: null,
          isPublic: true,
          sortOrder: 0,
          _count: { words: 2, predefinedWords: 4 },
        },
      ]);

      const result = await service.adminGetCollections();

      assert.equal(result.length, 1);
      assert.equal(result[0].wordCount, 2);
      assert.equal(result[0].predefinedWordCount, 4);
    });

    it('should return empty array when no public collections exist', async () => {
      prisma.dictionaryCollection.findMany.mock.mockImplementation(async () => []);

      const result = await service.adminGetCollections();

      assert.deepEqual(result, []);
    });
  });

  describe('adminCreateCollection', () => {
    it('should create a public collection with sortOrder default', async () => {
      prisma.dictionaryCollection.create.mock.mockImplementation(async () => ({
        id: 'col1',
        nameRu: 'A',
        nameUk: 'B',
        nameEn: 'C',
        isPublic: true,
      }));

      await service.adminCreateCollection('admin1', {
        nameRu: 'A',
        nameUk: 'B',
        nameEn: 'C',
      });

      const args = prisma.dictionaryCollection.create.mock.calls[0].arguments[0];
      assert.equal(args.data.isPublic, true);
      assert.equal(args.data.createdByAdminId, 'admin1');
      assert.equal(args.data.sortOrder, 0);
    });
  });

  describe('adminUpdateCollection', () => {
    it('should update only provided fields', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: true,
      }));
      prisma.dictionaryCollection.update.mock.mockImplementation(async () => ({
        id: 'col1',
        nameEn: 'Updated',
      }));

      const result = await service.adminUpdateCollection('col1', { nameEn: 'Updated' });

      const args = prisma.dictionaryCollection.update.mock.calls[0].arguments[0];
      assert.deepEqual(args.data, { nameEn: 'Updated' });
      assert.equal(result.nameEn, 'Updated');
    });

    it('should throw NotFoundException when collection does not exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.adminUpdateCollection('missing', {}), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when collection is not public', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: false,
      }));

      await assert.rejects(() => service.adminUpdateCollection('col1', {}), {
        name: 'ForbiddenException',
      });
    });
  });

  describe('adminDeleteCollection', () => {
    it('should delete a public collection', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: true,
      }));
      prisma.dictionaryCollection.delete.mock.mockImplementation(async () => ({}));

      await service.adminDeleteCollection('col1');

      assert.equal(prisma.dictionaryCollection.delete.mock.callCount(), 1);
    });

    it('should throw NotFoundException when collection does not exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.adminDeleteCollection('missing'), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when collection is not public (words preserved via SetNull)', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: false,
      }));

      await assert.rejects(() => service.adminDeleteCollection('col1'), {
        name: 'ForbiddenException',
      });
      assert.equal(prisma.dictionaryCollection.delete.mock.callCount(), 0);
    });
  });

  describe('adminGetCollectionWords', () => {
    it('should return words ordered by sortOrder', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: true,
      }));
      prisma.predefinedDictionaryWord.findMany.mock.mockImplementation(async () => [
        { id: 'w1' },
        { id: 'w2' },
      ]);

      const result = await service.adminGetCollectionWords('col1');

      assert.equal(result.length, 2);
    });

    it('should throw NotFoundException when collection does not exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.adminGetCollectionWords('missing'), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when collection is not public', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: false,
      }));

      await assert.rejects(() => service.adminGetCollectionWords('col1'), {
        name: 'ForbiddenException',
      });
    });
  });

  describe('adminAddCollectionWord', () => {
    const dto = {
      wordHr: 'kruh',
      translationRu: 'хлеб',
      translationUk: 'хліб',
      translationEn: 'bread',
    };

    it('should create a predefined word', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: true,
      }));
      prisma.predefinedDictionaryWord.create.mock.mockImplementation(async () => ({
        id: 'w1',
        ...dto,
      }));

      const result = await service.adminAddCollectionWord('col1', dto);

      assert.equal(result.id, 'w1');
    });

    it('should throw NotFoundException when collection does not exist', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.adminAddCollectionWord('missing', dto), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when collection is not public', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: false,
      }));

      await assert.rejects(() => service.adminAddCollectionWord('col1', dto), {
        name: 'ForbiddenException',
      });
    });

    it('should throw ConflictException on duplicate word (P2002)', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: true,
      }));
      const { Prisma } = await import('@prisma/client');
      prisma.predefinedDictionaryWord.create.mock.mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '5.0.0',
        });
      });

      await assert.rejects(() => service.adminAddCollectionWord('col1', dto), {
        name: 'ConflictException',
      });
    });

    it('should rethrow unrelated errors', async () => {
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        id: 'col1',
        isPublic: true,
      }));
      prisma.predefinedDictionaryWord.create.mock.mockImplementation(async () => {
        throw new Error('boom');
      });

      await assert.rejects(() => service.adminAddCollectionWord('col1', dto), {
        message: 'boom',
      });
    });
  });

  describe('adminUpdateCollectionWord', () => {
    it('should update a word in a public collection', async () => {
      prisma.predefinedDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        collection: { isPublic: true },
      }));
      prisma.predefinedDictionaryWord.update.mock.mockImplementation(async () => ({
        id: 'w1',
        wordHr: 'updated',
      }));

      const result = await service.adminUpdateCollectionWord('w1', { wordHr: 'updated' });

      assert.equal(result.wordHr, 'updated');
    });

    it('should throw NotFoundException when word does not exist', async () => {
      prisma.predefinedDictionaryWord.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.adminUpdateCollectionWord('missing', {}), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when parent collection is not public', async () => {
      prisma.predefinedDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        collection: { isPublic: false },
      }));

      await assert.rejects(() => service.adminUpdateCollectionWord('w1', {}), {
        name: 'ForbiddenException',
      });
    });
  });

  describe('adminDeleteCollectionWord', () => {
    it('should delete a word in a public collection', async () => {
      prisma.predefinedDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        collection: { isPublic: true },
      }));
      prisma.predefinedDictionaryWord.delete.mock.mockImplementation(async () => ({}));

      await service.adminDeleteCollectionWord('w1');

      assert.equal(prisma.predefinedDictionaryWord.delete.mock.callCount(), 1);
    });

    it('should throw NotFoundException when word does not exist', async () => {
      prisma.predefinedDictionaryWord.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.adminDeleteCollectionWord('missing'), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException when parent collection is not public', async () => {
      prisma.predefinedDictionaryWord.findUnique.mock.mockImplementation(async () => ({
        id: 'w1',
        collection: { isPublic: false },
      }));

      await assert.rejects(() => service.adminDeleteCollectionWord('w1'), {
        name: 'ForbiddenException',
      });
    });
  });
});
