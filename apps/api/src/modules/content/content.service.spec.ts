import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { ExerciseType } from '@cro/shared';

import { ContentService } from './content.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    exerciseTopic: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
    },
    exerciseTopicType: {
      upsert: mock.fn() as MockFn,
      deleteMany: mock.fn() as MockFn,
    },
    typeTheAnswerItem: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
      count: mock.fn() as MockFn,
    },
    flashcardItem: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
      count: mock.fn() as MockFn,
    },
    fillInBlankItem: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
      count: mock.fn() as MockFn,
    },
    buildSentenceItem: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
      count: mock.fn() as MockFn,
    },
    buildSentenceWord: {
      findUnique: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      deleteMany: mock.fn() as MockFn,
      createMany: mock.fn() as MockFn,
    },
    distractorSet: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
    },
  };
}

function createMockCache() {
  return {
    get: mock.fn(async () => null) as MockFn,
    set: mock.fn(async () => undefined) as MockFn,
    invalidate: mock.fn(async () => undefined) as MockFn,
    invalidatePattern: mock.fn(async () => undefined) as MockFn,
  };
}

const baseTopic = {
  id: 'topic1',
  nameHr: 'Padeži',
  nameRu: 'Падежи',
  nameUk: 'Відмінки',
  nameEn: 'Cases',
  sortOrder: 0,
  isActive: true,
  rulesHtml: null,
};

describe('ContentService', () => {
  let service: ContentService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let cache: ReturnType<typeof createMockCache>;

  beforeEach(() => {
    prisma = createMockPrisma();
    cache = createMockCache();
    service = new ContentService(prisma as never, cache as never);
  });

  describe('getActiveTopics', () => {
    it('should return cached topics when present', async () => {
      cache.get.mock.mockImplementation(async () => [{ id: 'cached' }]);

      const result = await service.getActiveTopics();

      assert.deepEqual(result, [{ id: 'cached' }]);
      assert.equal(prisma.exerciseTopic.findMany.mock.callCount(), 0);
    });

    it('should query and map topicTypes into exerciseTypes, then cache the result', async () => {
      prisma.exerciseTopic.findMany.mock.mockImplementation(async () => [
        {
          ...baseTopic,
          topicTypes: [
            { exerciseType: ExerciseType.FLASHCARDS },
            { exerciseType: ExerciseType.TYPE_THE_ANSWER },
          ],
        },
      ]);

      const result = (await service.getActiveTopics()) as Array<{
        exerciseTypes: string[];
        topicTypes?: unknown;
      }>;

      assert.equal(prisma.exerciseTopic.findMany.mock.callCount(), 1);
      const args = prisma.exerciseTopic.findMany.mock.calls[0].arguments[0];
      assert.deepEqual(args.where, { isActive: true });
      assert.equal(result.length, 1);
      assert.deepEqual(result[0].exerciseTypes, [
        ExerciseType.FLASHCARDS,
        ExerciseType.TYPE_THE_ANSWER,
      ]);
      assert.equal(result[0].topicTypes, undefined);
      assert.equal(cache.set.mock.callCount(), 1);
    });

    it('should return an empty array when there are no active topics', async () => {
      prisma.exerciseTopic.findMany.mock.mockImplementation(async () => []);

      const result = await service.getActiveTopics();

      assert.deepEqual(result, []);
    });
  });

  describe('getAllTopics', () => {
    it('should map every topic regardless of isActive', async () => {
      prisma.exerciseTopic.findMany.mock.mockImplementation(async () => [
        { ...baseTopic, isActive: false, topicTypes: [] },
      ]);

      const result = await service.getAllTopics();

      assert.equal(prisma.exerciseTopic.findMany.mock.callCount(), 1);
      assert.deepEqual(prisma.exerciseTopic.findMany.mock.calls[0].arguments[0].orderBy, {
        sortOrder: 'asc',
      });
      assert.equal(result.length, 1);
      assert.deepEqual(result[0].exerciseTypes, []);
    });
  });

  describe('getTopicById', () => {
    it('should return the topic with its exerciseTypes', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
        ...baseTopic,
        topicTypes: [{ exerciseType: ExerciseType.FILL_IN_BLANK }],
      }));

      const result = await service.getTopicById('topic1');

      assert.equal(result.id, 'topic1');
      assert.deepEqual(result.exerciseTypes, [ExerciseType.FILL_IN_BLANK]);
    });

    it('should throw NotFoundException when the topic does not exist', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.getTopicById('missing'), { name: 'NotFoundException' });
    });
  });

  describe('createTopic', () => {
    it('should create the topic, invalidate the cache, and return exerciseTypes: []', async () => {
      prisma.exerciseTopic.create.mock.mockImplementation(async () => baseTopic);

      const result = await service.createTopic({
        nameHr: 'a',
        nameRu: 'b',
        nameUk: 'c',
        nameEn: 'd',
      });

      assert.equal(prisma.exerciseTopic.create.mock.callCount(), 1);
      assert.deepEqual(result.exerciseTypes, []);
      assert.equal(cache.invalidate.mock.callCount(), 1);
      assert.deepEqual(cache.invalidate.mock.calls[0].arguments, ['content:topics']);
    });
  });

  describe('updateTopic', () => {
    it('should update an existing topic and return mapped exerciseTypes', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
        ...baseTopic,
        topicTypes: [],
      }));
      prisma.exerciseTopic.update.mock.mockImplementation(async () => ({
        ...baseTopic,
        nameEn: 'Updated',
        topicTypes: [{ exerciseType: ExerciseType.FLASHCARDS }],
      }));

      const result = await service.updateTopic('topic1', { nameEn: 'Updated' });

      assert.equal(result.nameEn, 'Updated');
      assert.deepEqual(result.exerciseTypes, [ExerciseType.FLASHCARDS]);
      assert.equal(cache.invalidate.mock.callCount(), 1);
    });

    it('should throw NotFoundException when the topic does not exist', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.updateTopic('missing', { nameEn: 'x' }), {
        name: 'NotFoundException',
      });
      assert.equal(prisma.exerciseTopic.update.mock.callCount(), 0);
    });
  });

  describe('deleteTopic', () => {
    it('should delete the topic when it has no items', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
        ...baseTopic,
        topicTypes: [],
      }));
      prisma.typeTheAnswerItem.count.mock.mockImplementation(async () => 0);
      prisma.flashcardItem.count.mock.mockImplementation(async () => 0);
      prisma.fillInBlankItem.count.mock.mockImplementation(async () => 0);
      prisma.buildSentenceItem.count.mock.mockImplementation(async () => 0);

      await service.deleteTopic('topic1');

      assert.equal(prisma.exerciseTopic.delete.mock.callCount(), 1);
      assert.equal(cache.invalidate.mock.callCount(), 1);
    });

    it('should throw ConflictException when items still exist', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
        ...baseTopic,
        topicTypes: [],
      }));
      prisma.typeTheAnswerItem.count.mock.mockImplementation(async () => 2);
      prisma.flashcardItem.count.mock.mockImplementation(async () => 0);
      prisma.fillInBlankItem.count.mock.mockImplementation(async () => 0);
      prisma.buildSentenceItem.count.mock.mockImplementation(async () => 0);

      await assert.rejects(() => service.deleteTopic('topic1'), { name: 'ConflictException' });
      assert.equal(prisma.exerciseTopic.delete.mock.callCount(), 0);
    });

    it('should throw NotFoundException when the topic does not exist', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.deleteTopic('missing'), { name: 'NotFoundException' });
    });
  });

  describe('updateTopicTypes', () => {
    it('should upsert enabled types and deleteMany disabled types, then return refreshed topic', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
        ...baseTopic,
        topicTypes: [],
      }));

      const result = await service.updateTopicTypes('topic1', [
        { exerciseType: ExerciseType.FLASHCARDS, enabled: true },
        { exerciseType: ExerciseType.TYPE_THE_ANSWER, enabled: false },
      ]);

      assert.equal(prisma.exerciseTopicType.upsert.mock.callCount(), 1);
      assert.equal(prisma.exerciseTopicType.deleteMany.mock.callCount(), 1);
      const upsertArgs = prisma.exerciseTopicType.upsert.mock.calls[0].arguments[0];
      assert.deepEqual(upsertArgs.where.topicId_exerciseType, {
        topicId: 'topic1',
        exerciseType: ExerciseType.FLASHCARDS,
      });
      const deleteArgs = prisma.exerciseTopicType.deleteMany.mock.calls[0].arguments[0];
      assert.deepEqual(deleteArgs.where, {
        topicId: 'topic1',
        exerciseType: ExerciseType.TYPE_THE_ANSWER,
      });
      assert.equal(cache.invalidate.mock.callCount(), 1);
      assert.equal(result.id, 'topic1');
    });

    it('should throw NotFoundException when the topic does not exist', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(
        () =>
          service.updateTopicTypes('missing', [
            { exerciseType: ExerciseType.FLASHCARDS, enabled: true },
          ]),
        { name: 'NotFoundException' },
      );
    });

    it('should handle an empty configs list without any upsert/deleteMany calls', async () => {
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
        ...baseTopic,
        topicTypes: [],
      }));

      await service.updateTopicTypes('topic1', []);

      assert.equal(prisma.exerciseTopicType.upsert.mock.callCount(), 0);
      assert.equal(prisma.exerciseTopicType.deleteMany.mock.callCount(), 0);
    });
  });

  describe('Type The Answer Items', () => {
    describe('getTypeTheAnswerItems', () => {
      it('should return items ordered by sortOrder', async () => {
        prisma.typeTheAnswerItem.findMany.mock.mockImplementation(async () => [{ id: 'i1' }]);

        const result = await service.getTypeTheAnswerItems('topic1');

        assert.deepEqual(prisma.typeTheAnswerItem.findMany.mock.calls[0].arguments[0], {
          where: { topicId: 'topic1' },
          orderBy: { sortOrder: 'asc' },
        });
        assert.equal(result.length, 1);
      });

      it('should return an empty array when there are no items', async () => {
        prisma.typeTheAnswerItem.findMany.mock.mockImplementation(async () => []);

        const result = await service.getTypeTheAnswerItems('topic1');

        assert.deepEqual(result, []);
      });
    });

    describe('createTypeTheAnswerItem', () => {
      const dto = {
        topicId: 'topic1',
        baseForm: 'ići',
        answer: 'idem',
        translationRu: 'r',
        translationUk: 'u',
        translationEn: 'e',
      };

      it('should create the item when the topic exists and baseForm is unique', async () => {
        prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
          ...baseTopic,
          topicTypes: [],
        }));
        prisma.typeTheAnswerItem.findUnique.mock.mockImplementation(async () => null);
        prisma.typeTheAnswerItem.create.mock.mockImplementation(async () => ({
          id: 'item1',
          ...dto,
        }));

        const result = await service.createTypeTheAnswerItem(dto);

        assert.equal(result.id, 'item1');
        assert.equal(cache.invalidate.mock.callCount(), 1);
        assert.deepEqual(cache.invalidate.mock.calls[0].arguments, [
          `content:topic:topic1:items:${ExerciseType.TYPE_THE_ANSWER}`,
        ]);
      });

      it('should throw NotFoundException when the topic does not exist', async () => {
        prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.createTypeTheAnswerItem(dto), {
          name: 'NotFoundException',
        });
        assert.equal(prisma.typeTheAnswerItem.create.mock.callCount(), 0);
      });

      it('should throw ConflictException when baseForm already exists', async () => {
        prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
          ...baseTopic,
          topicTypes: [],
        }));
        prisma.typeTheAnswerItem.findUnique.mock.mockImplementation(async () => ({
          id: 'existing',
        }));

        await assert.rejects(() => service.createTypeTheAnswerItem(dto), {
          name: 'ConflictException',
        });
        assert.equal(prisma.typeTheAnswerItem.create.mock.callCount(), 0);
      });
    });

    describe('updateTypeTheAnswerItem', () => {
      it('should update the item when it exists and baseForm is unchanged', async () => {
        prisma.typeTheAnswerItem.findUnique.mock.mockImplementation(async () => ({
          id: 'item1',
          topicId: 'topic1',
          baseForm: 'ići',
        }));
        prisma.typeTheAnswerItem.update.mock.mockImplementation(async () => ({
          id: 'item1',
          answer: 'idemo',
        }));

        const result = await service.updateTypeTheAnswerItem('item1', { answer: 'idemo' });

        assert.equal(result.answer, 'idemo');
        assert.equal(prisma.typeTheAnswerItem.findUnique.mock.callCount(), 1);
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the item does not exist', async () => {
        prisma.typeTheAnswerItem.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.updateTypeTheAnswerItem('missing', { answer: 'x' }), {
          name: 'NotFoundException',
        });
      });

      it('should throw ConflictException when changing baseForm to one already used', async () => {
        prisma.typeTheAnswerItem.findUnique.mock.mockImplementation(
          (where: { where: { id?: string; baseForm?: string } }) => {
            if (where.where.id === 'item1') {
              return Promise.resolve({ id: 'item1', topicId: 'topic1', baseForm: 'ići' });
            }
            return Promise.resolve({ id: 'other', baseForm: 'raditi' });
          },
        );

        await assert.rejects(
          () => service.updateTypeTheAnswerItem('item1', { baseForm: 'raditi' }),
          {
            name: 'ConflictException',
          },
        );
        assert.equal(prisma.typeTheAnswerItem.update.mock.callCount(), 0);
      });

      it('should allow updating baseForm to the same value without a conflict check triggering', async () => {
        prisma.typeTheAnswerItem.findUnique.mock.mockImplementation(async () => ({
          id: 'item1',
          topicId: 'topic1',
          baseForm: 'ići',
        }));
        prisma.typeTheAnswerItem.update.mock.mockImplementation(async () => ({
          id: 'item1',
          baseForm: 'ići',
        }));

        const result = await service.updateTypeTheAnswerItem('item1', { baseForm: 'ići' });

        assert.equal(result.baseForm, 'ići');
        assert.equal(prisma.typeTheAnswerItem.update.mock.callCount(), 1);
      });
    });

    describe('deleteTypeTheAnswerItem', () => {
      it('should delete the item and invalidate the cache', async () => {
        prisma.typeTheAnswerItem.findUnique.mock.mockImplementation(async () => ({
          id: 'item1',
          topicId: 'topic1',
        }));

        await service.deleteTypeTheAnswerItem('item1');

        assert.equal(prisma.typeTheAnswerItem.delete.mock.callCount(), 1);
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the item does not exist', async () => {
        prisma.typeTheAnswerItem.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.deleteTypeTheAnswerItem('missing'), {
          name: 'NotFoundException',
        });
      });
    });
  });

  describe('Flashcard Items', () => {
    const dto = {
      topicId: 'topic1',
      frontText: 'kuća',
      translationRu: 'r',
      translationUk: 'u',
      translationEn: 'house',
    };

    describe('getFlashcardItems', () => {
      it('should return items ordered by sortOrder', async () => {
        prisma.flashcardItem.findMany.mock.mockImplementation(async () => [{ id: 'f1' }]);

        const result = await service.getFlashcardItems('topic1');

        assert.equal(result.length, 1);
      });

      it('should return an empty array when there are no items', async () => {
        prisma.flashcardItem.findMany.mock.mockImplementation(async () => []);

        const result = await service.getFlashcardItems('topic1');

        assert.deepEqual(result, []);
      });
    });

    describe('createFlashcardItem', () => {
      it('should create the item when the topic exists', async () => {
        prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
          ...baseTopic,
          topicTypes: [],
        }));
        prisma.flashcardItem.create.mock.mockImplementation(async () => ({ id: 'f1', ...dto }));

        const result = await service.createFlashcardItem(dto);

        assert.equal(result.id, 'f1');
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the topic does not exist', async () => {
        prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.createFlashcardItem(dto), { name: 'NotFoundException' });
        assert.equal(prisma.flashcardItem.create.mock.callCount(), 0);
      });
    });

    describe('updateFlashcardItem', () => {
      it('should update the item when it exists', async () => {
        prisma.flashcardItem.findUnique.mock.mockImplementation(async () => ({
          id: 'f1',
          topicId: 'topic1',
        }));
        prisma.flashcardItem.update.mock.mockImplementation(async () => ({
          id: 'f1',
          frontText: 'nova',
        }));

        const result = await service.updateFlashcardItem('f1', { frontText: 'nova' });

        assert.equal(result.frontText, 'nova');
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the item does not exist', async () => {
        prisma.flashcardItem.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.updateFlashcardItem('missing', { frontText: 'x' }), {
          name: 'NotFoundException',
        });
      });
    });

    describe('deleteFlashcardItem', () => {
      it('should delete the item and invalidate the cache', async () => {
        prisma.flashcardItem.findUnique.mock.mockImplementation(async () => ({
          id: 'f1',
          topicId: 'topic1',
        }));

        await service.deleteFlashcardItem('f1');

        assert.equal(prisma.flashcardItem.delete.mock.callCount(), 1);
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the item does not exist', async () => {
        prisma.flashcardItem.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.deleteFlashcardItem('missing'), {
          name: 'NotFoundException',
        });
      });
    });
  });

  describe('Fill In Blank Items', () => {
    const dto = {
      topicId: 'topic1',
      sentenceHr: 'Ja {{BLANK}} u školu.',
      blankAnswer: 'idem',
      translationRu: 'r',
      translationUk: 'u',
      translationEn: 'e',
    };

    describe('getFillInBlankItems', () => {
      it('should return items ordered by sortOrder', async () => {
        prisma.fillInBlankItem.findMany.mock.mockImplementation(async () => [{ id: 'fb1' }]);

        const result = await service.getFillInBlankItems('topic1');

        assert.equal(result.length, 1);
      });

      it('should return an empty array when there are no items', async () => {
        prisma.fillInBlankItem.findMany.mock.mockImplementation(async () => []);

        const result = await service.getFillInBlankItems('topic1');

        assert.deepEqual(result, []);
      });
    });

    describe('createFillInBlankItem', () => {
      it('should create the item when the topic exists', async () => {
        prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
          ...baseTopic,
          topicTypes: [],
        }));
        prisma.fillInBlankItem.create.mock.mockImplementation(async () => ({ id: 'fb1', ...dto }));

        const result = await service.createFillInBlankItem(dto);

        assert.equal(result.id, 'fb1');
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the topic does not exist', async () => {
        prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.createFillInBlankItem(dto), {
          name: 'NotFoundException',
        });
        assert.equal(prisma.fillInBlankItem.create.mock.callCount(), 0);
      });
    });

    describe('updateFillInBlankItem', () => {
      it('should update the item when it exists', async () => {
        prisma.fillInBlankItem.findUnique.mock.mockImplementation(async () => ({
          id: 'fb1',
          topicId: 'topic1',
        }));
        prisma.fillInBlankItem.update.mock.mockImplementation(async () => ({
          id: 'fb1',
          blankAnswer: 'idemo',
        }));

        const result = await service.updateFillInBlankItem('fb1', { blankAnswer: 'idemo' });

        assert.equal(result.blankAnswer, 'idemo');
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the item does not exist', async () => {
        prisma.fillInBlankItem.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.updateFillInBlankItem('missing', { blankAnswer: 'x' }), {
          name: 'NotFoundException',
        });
      });
    });

    describe('deleteFillInBlankItem', () => {
      it('should delete the item and invalidate the cache', async () => {
        prisma.fillInBlankItem.findUnique.mock.mockImplementation(async () => ({
          id: 'fb1',
          topicId: 'topic1',
        }));

        await service.deleteFillInBlankItem('fb1');

        assert.equal(prisma.fillInBlankItem.delete.mock.callCount(), 1);
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the item does not exist', async () => {
        prisma.fillInBlankItem.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.deleteFillInBlankItem('missing'), {
          name: 'NotFoundException',
        });
      });
    });
  });

  describe('Build Sentence Items', () => {
    describe('getBuildSentenceItems', () => {
      it('should return items with words ordered by position', async () => {
        prisma.buildSentenceItem.findMany.mock.mockImplementation(async () => [
          { id: 'bs1', words: [{ position: 0, wordHr: 'Ja' }] },
        ]);

        const result = await service.getBuildSentenceItems('topic1');

        assert.equal(result.length, 1);
        assert.deepEqual(prisma.buildSentenceItem.findMany.mock.calls[0].arguments[0].where, {
          topicId: 'topic1',
        });
      });
    });

    describe('checkBuildSentenceDuplicate', () => {
      it('should report exists: true when a matching sentence is found', async () => {
        prisma.buildSentenceItem.findMany.mock.mockImplementation(async () => [
          {
            id: 'bs1',
            words: [
              { position: 0, wordHr: 'Ja' },
              { position: 1, wordHr: 'idem' },
            ],
          },
        ]);

        const result = await service.checkBuildSentenceDuplicate('topic1', 'Ja idem');

        assert.deepEqual(result, { exists: true });
      });

      it('should report exists: false when no sentence matches', async () => {
        prisma.buildSentenceItem.findMany.mock.mockImplementation(async () => [
          { id: 'bs1', words: [{ position: 0, wordHr: 'Ja' }] },
        ]);

        const result = await service.checkBuildSentenceDuplicate('topic1', 'Ti ideš');

        assert.deepEqual(result, { exists: false });
      });

      it('should exclude the given item id from the comparison', async () => {
        prisma.buildSentenceItem.findMany.mock.mockImplementation(async () => [
          {
            id: 'bs1',
            words: [
              { position: 0, wordHr: 'Ja' },
              { position: 1, wordHr: 'idem' },
            ],
          },
        ]);

        const result = await service.checkBuildSentenceDuplicate('topic1', 'Ja idem', 'bs1');

        assert.deepEqual(result, { exists: false });
      });
    });

    describe('createBuildSentenceItem', () => {
      it('should create the item with nested words when the topic exists', async () => {
        prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({
          ...baseTopic,
          topicTypes: [],
        }));
        prisma.buildSentenceItem.create.mock.mockImplementation(async () => ({
          id: 'bs1',
          words: [{ position: 0, wordHr: 'Ja' }],
        }));

        const result = await service.createBuildSentenceItem({
          topicId: 'topic1',
          translationRu: 'r',
          translationUk: 'u',
          translationEn: 'e',
          words: [{ wordHr: 'Ja', position: 0, distractors: [] }],
        });

        assert.equal(result.id, 'bs1');
        assert.equal(cache.invalidate.mock.callCount(), 1);
        const createArgs = prisma.buildSentenceItem.create.mock.calls[0].arguments[0];
        assert.deepEqual(createArgs.data.words.create, [
          { wordHr: 'Ja', position: 0, distractors: [] },
        ]);
      });

      it('should throw NotFoundException when the topic does not exist', async () => {
        prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(
          () =>
            service.createBuildSentenceItem({
              topicId: 'missing',
              translationRu: 'r',
              translationUk: 'u',
              translationEn: 'e',
              words: [],
            }),
          { name: 'NotFoundException' },
        );
      });
    });

    describe('updateBuildSentenceItem', () => {
      it('should replace words when words are provided', async () => {
        prisma.buildSentenceItem.findUnique.mock.mockImplementation(async () => ({
          id: 'bs1',
          topicId: 'topic1',
        }));
        prisma.buildSentenceItem.update.mock.mockImplementation(async () => ({
          id: 'bs1',
          words: [],
        }));

        await service.updateBuildSentenceItem('bs1', {
          words: [{ wordHr: 'Mi', position: 0, distractors: [] }],
        });

        assert.equal(prisma.buildSentenceWord.deleteMany.mock.callCount(), 1);
        assert.equal(prisma.buildSentenceWord.createMany.mock.callCount(), 1);
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should not touch words when words is undefined', async () => {
        prisma.buildSentenceItem.findUnique.mock.mockImplementation(async () => ({
          id: 'bs1',
          topicId: 'topic1',
        }));
        prisma.buildSentenceItem.update.mock.mockImplementation(async () => ({
          id: 'bs1',
          words: [],
        }));

        await service.updateBuildSentenceItem('bs1', {});

        assert.equal(prisma.buildSentenceWord.deleteMany.mock.callCount(), 0);
        assert.equal(prisma.buildSentenceWord.createMany.mock.callCount(), 0);
      });

      it('should throw NotFoundException when the item does not exist', async () => {
        prisma.buildSentenceItem.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.updateBuildSentenceItem('missing', {}), {
          name: 'NotFoundException',
        });
      });
    });

    describe('updateBuildSentenceWord', () => {
      it('should update the distractors of an existing word', async () => {
        prisma.buildSentenceWord.findUnique.mock.mockImplementation(async () => ({ id: 'w1' }));
        prisma.buildSentenceWord.update.mock.mockImplementation(async () => ({
          id: 'w1',
          distractors: ['a', 'b'],
        }));

        const result = await service.updateBuildSentenceWord('w1', { distractors: ['a', 'b'] });

        assert.deepEqual(result.distractors, ['a', 'b']);
      });

      it('should throw NotFoundException when the word does not exist', async () => {
        prisma.buildSentenceWord.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(
          () => service.updateBuildSentenceWord('missing', { distractors: [] }),
          {
            name: 'NotFoundException',
          },
        );
      });
    });

    describe('deleteBuildSentenceItem', () => {
      it('should delete the item and invalidate the cache', async () => {
        prisma.buildSentenceItem.findUnique.mock.mockImplementation(async () => ({
          id: 'bs1',
          topicId: 'topic1',
        }));

        await service.deleteBuildSentenceItem('bs1');

        assert.equal(prisma.buildSentenceItem.delete.mock.callCount(), 1);
        assert.equal(cache.invalidate.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the item does not exist', async () => {
        prisma.buildSentenceItem.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.deleteBuildSentenceItem('missing'), {
          name: 'NotFoundException',
        });
      });
    });
  });

  describe('getItemsForTopic', () => {
    it('should return cached items when present without querying the DB', async () => {
      cache.get.mock.mockImplementation(async () => [{ id: 'cached-item' }]);

      const result = await service.getItemsForTopic('topic1', ExerciseType.FLASHCARDS);

      assert.deepEqual(result, [{ id: 'cached-item' }]);
      assert.equal(prisma.flashcardItem.findMany.mock.callCount(), 0);
    });

    it('should query, cache, and return items for TYPE_THE_ANSWER', async () => {
      prisma.typeTheAnswerItem.findMany.mock.mockImplementation(async () => [{ id: 'a1' }]);

      const result = await service.getItemsForTopic('topic1', ExerciseType.TYPE_THE_ANSWER);

      assert.equal(result.length, 1);
      assert.equal(cache.set.mock.callCount(), 1);
    });

    it('should query items for FILL_IN_BLANK', async () => {
      prisma.fillInBlankItem.findMany.mock.mockImplementation(async () => [{ id: 'fb1' }]);

      const result = await service.getItemsForTopic('topic1', ExerciseType.FILL_IN_BLANK);

      assert.equal(result.length, 1);
    });

    it('should query items for BUILD_SENTENCE', async () => {
      prisma.buildSentenceItem.findMany.mock.mockImplementation(async () => [{ id: 'bs1' }]);

      const result = await service.getItemsForTopic('topic1', ExerciseType.BUILD_SENTENCE);

      assert.equal(result.length, 1);
    });
  });

  describe('getItemsByIds', () => {
    it('should return an empty array when itemIds is empty', async () => {
      const result = await service.getItemsByIds(ExerciseType.FLASHCARDS, []);

      assert.deepEqual(result, []);
      assert.equal(prisma.flashcardItem.findMany.mock.callCount(), 0);
    });

    it('should fetch TYPE_THE_ANSWER items by id', async () => {
      prisma.typeTheAnswerItem.findMany.mock.mockImplementation(async () => [{ id: 'a1' }]);

      const result = await service.getItemsByIds(ExerciseType.TYPE_THE_ANSWER, ['a1']);

      assert.equal(result.length, 1);
      assert.deepEqual(prisma.typeTheAnswerItem.findMany.mock.calls[0].arguments[0].where, {
        id: { in: ['a1'] },
      });
    });

    it('should fetch FLASHCARDS items by id', async () => {
      prisma.flashcardItem.findMany.mock.mockImplementation(async () => [{ id: 'f1' }]);

      const result = await service.getItemsByIds(ExerciseType.FLASHCARDS, ['f1']);

      assert.equal(result.length, 1);
    });

    it('should fetch FILL_IN_BLANK items by id', async () => {
      prisma.fillInBlankItem.findMany.mock.mockImplementation(async () => [{ id: 'fb1' }]);

      const result = await service.getItemsByIds(ExerciseType.FILL_IN_BLANK, ['fb1']);

      assert.equal(result.length, 1);
    });

    it('should fetch BUILD_SENTENCE items with generated distractor options', async () => {
      prisma.buildSentenceItem.findMany.mock.mockImplementation(async () => [
        {
          id: 'bs1',
          words: [{ id: 'w1', wordHr: 'Ja', position: 0, distractors: ['Ti', 'On'] }],
        },
      ]);
      prisma.distractorSet.findMany.mock.mockImplementation(async () => []);

      const result = await service.getItemsByIds(ExerciseType.BUILD_SENTENCE, ['bs1']);

      assert.equal(result.length, 1);
      const item = result[0] as { words: { options: string[] }[] };
      assert.equal(item.words.length, 1);
      assert.ok(item.words[0].options.includes('Ja'));
    });

    it('should prefer a matching distractor set for BUILD_SENTENCE options', async () => {
      prisma.buildSentenceItem.findMany.mock.mockImplementation(async () => [
        {
          id: 'bs1',
          words: [{ id: 'w1', wordHr: 'Ja', position: 0, distractors: [] }],
        },
      ]);
      prisma.distractorSet.findMany.mock.mockImplementation(async () => [
        { id: 'ds1', name: 'pronouns', words: ['Ja', 'Ti', 'On', 'Ona', 'Mi', 'Vi'] },
      ]);

      const result = await service.getItemsByIds(ExerciseType.BUILD_SENTENCE, ['bs1']);

      const item = result[0] as { words: { options: string[] }[] };
      assert.ok(item.words[0].options.includes('Ja'));
      assert.ok(item.words[0].options.length <= 6);
    });
  });

  describe('Distractor Sets', () => {
    describe('listDistractorSets', () => {
      it('should list sets ordered by name', async () => {
        prisma.distractorSet.findMany.mock.mockImplementation(async () => [
          { id: 'ds1', name: 'pronouns' },
        ]);

        const result = await service.listDistractorSets();

        assert.equal(result.length, 1);
        assert.deepEqual(prisma.distractorSet.findMany.mock.calls[0].arguments[0], {
          orderBy: { name: 'asc' },
        });
      });

      it('should return an empty array when there are no sets', async () => {
        prisma.distractorSet.findMany.mock.mockImplementation(async () => []);

        const result = await service.listDistractorSets();

        assert.deepEqual(result, []);
      });
    });

    describe('createDistractorSet', () => {
      it('should create the set when the name is unique', async () => {
        prisma.distractorSet.findUnique.mock.mockImplementation(async () => null);
        prisma.distractorSet.create.mock.mockImplementation(async () => ({
          id: 'ds1',
          name: 'colors',
          words: ['a'],
        }));

        const result = await service.createDistractorSet({ name: 'colors', words: ['a'] });

        assert.equal(result.id, 'ds1');
      });

      it('should throw ConflictException when the name already exists', async () => {
        prisma.distractorSet.findUnique.mock.mockImplementation(async () => ({ id: 'existing' }));

        await assert.rejects(() => service.createDistractorSet({ name: 'colors', words: ['a'] }), {
          name: 'ConflictException',
        });
        assert.equal(prisma.distractorSet.create.mock.callCount(), 0);
      });
    });

    describe('updateDistractorSet', () => {
      it('should update the set when it exists and name is unchanged', async () => {
        prisma.distractorSet.findUnique.mock.mockImplementation(async () => ({
          id: 'ds1',
          name: 'colors',
        }));
        prisma.distractorSet.update.mock.mockImplementation(async () => ({
          id: 'ds1',
          words: ['a', 'b'],
        }));

        const result = await service.updateDistractorSet('ds1', { words: ['a', 'b'] });

        assert.deepEqual(result.words, ['a', 'b']);
      });

      it('should throw NotFoundException when the set does not exist', async () => {
        prisma.distractorSet.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.updateDistractorSet('missing', {}), {
          name: 'NotFoundException',
        });
      });

      it('should throw ConflictException when renaming to a name already in use', async () => {
        prisma.distractorSet.findUnique.mock.mockImplementation(
          (where: { where: { id?: string; name?: string } }) => {
            if (where.where.id === 'ds1') return Promise.resolve({ id: 'ds1', name: 'colors' });
            return Promise.resolve({ id: 'other', name: 'shapes' });
          },
        );

        await assert.rejects(() => service.updateDistractorSet('ds1', { name: 'shapes' }), {
          name: 'ConflictException',
        });
        assert.equal(prisma.distractorSet.update.mock.callCount(), 0);
      });
    });

    describe('deleteDistractorSet', () => {
      it('should delete the set when it exists', async () => {
        prisma.distractorSet.findUnique.mock.mockImplementation(async () => ({ id: 'ds1' }));

        await service.deleteDistractorSet('ds1');

        assert.equal(prisma.distractorSet.delete.mock.callCount(), 1);
      });

      it('should throw NotFoundException when the set does not exist', async () => {
        prisma.distractorSet.findUnique.mock.mockImplementation(async () => null);

        await assert.rejects(() => service.deleteDistractorSet('missing'), {
          name: 'NotFoundException',
        });
      });
    });
  });

  describe('llmGenerate', () => {
    it('should return distractors from a matching set without calling the LLM', async () => {
      prisma.distractorSet.findMany.mock.mockImplementation(async () => [
        { id: 'ds1', name: 'pronouns', words: ['Ja', 'Ti', 'On', 'Ona', 'Mi', 'Vi'] },
      ]);
      const fetchMock = mock.method(global, 'fetch', async () => {
        throw new Error('should not be called');
      });

      const result = await service.llmGenerate({ prompt: 'String: "Ja"\ngenerate distractors' });

      const parsed = JSON.parse(result.response) as { words: string[] };
      assert.equal(parsed.words.includes('Ja'), false);
      assert.equal(fetchMock.mock.callCount(), 0);
    });

    it('should call the LLM when no set matches and return its response', async () => {
      prisma.distractorSet.findMany.mock.mockImplementation(async () => []);
      mock.method(global, 'fetch', async () => ({
        ok: true,
        json: async () => ({ response: 'llm-response' }),
      }));

      const result = await service.llmGenerate({ prompt: 'String: "Nepoznata"\ngenerate' });

      assert.equal(result.response, 'llm-response');
    });

    it('should throw InternalServerErrorException when the LLM responds with an error status', async () => {
      prisma.distractorSet.findMany.mock.mockImplementation(async () => []);
      mock.method(global, 'fetch', async () => ({ ok: false, status: 500 }));

      await assert.rejects(() => service.llmGenerate({ prompt: 'no match here' }), {
        name: 'InternalServerErrorException',
      });
    });
  });
});
