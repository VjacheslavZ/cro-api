import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { LessonItemType } from '@cro/shared';

import { LessonsService } from './lessons.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    lesson: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
    },
    lessonItem: {
      findFirst: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      delete: mock.fn() as MockFn,
    },
    exerciseTopic: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
    },
    dictionaryCollection: {
      findMany: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
    },
  };
}

function baseLesson(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lesson1',
    titleHr: 'Naslov',
    titleRu: 'Заголовок',
    titleUk: 'Заголовок',
    titleEn: 'Title',
    descriptionHr: null,
    descriptionRu: null,
    descriptionUk: null,
    descriptionEn: null,
    sortOrder: 0,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    items: [],
    ...overrides,
  };
}

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new LessonsService(prisma as never);
  });

  describe('findAll', () => {
    it('should resolve item names for topics and collections', async () => {
      prisma.lesson.findMany.mock.mockImplementation(async () => [
        baseLesson({
          items: [
            {
              id: 'i1',
              lessonId: 'lesson1',
              itemType: LessonItemType.EXERCISE_TOPIC,
              itemId: 'topic1',
              sortOrder: 0,
              createdAt: new Date(),
            },
            {
              id: 'i2',
              lessonId: 'lesson1',
              itemType: LessonItemType.DICTIONARY_COLLECTION,
              itemId: 'col1',
              sortOrder: 1,
              createdAt: new Date(),
            },
          ],
        }),
      ]);
      prisma.exerciseTopic.findMany.mock.mockImplementation(async () => [
        { id: 'topic1', nameEn: 'Verbs' },
      ]);
      prisma.dictionaryCollection.findMany.mock.mockImplementation(async () => [
        { id: 'col1', nameEn: 'Food' },
      ]);

      const result = await service.findAll();

      assert.equal(result.length, 1);
      assert.equal(result[0].items[0].itemName, 'Verbs');
      assert.equal(result[0].items[1].itemName, 'Food');
      assert.equal(typeof result[0].createdAt, 'string');
    });

    it('should return empty array when no lessons exist', async () => {
      prisma.lesson.findMany.mock.mockImplementation(async () => []);

      const result = await service.findAll();

      assert.deepEqual(result, []);
      assert.equal(prisma.exerciseTopic.findMany.mock.callCount(), 0);
      assert.equal(prisma.dictionaryCollection.findMany.mock.callCount(), 0);
    });

    it('should fall back to itemId when referenced topic/collection is missing', async () => {
      prisma.lesson.findMany.mock.mockImplementation(async () => [
        baseLesson({
          items: [
            {
              id: 'i1',
              lessonId: 'lesson1',
              itemType: LessonItemType.EXERCISE_TOPIC,
              itemId: 'topic-missing',
              sortOrder: 0,
              createdAt: new Date(),
            },
          ],
        }),
      ]);
      prisma.exerciseTopic.findMany.mock.mockImplementation(async () => []);
      prisma.dictionaryCollection.findMany.mock.mockImplementation(async () => []);

      const result = await service.findAll();

      assert.equal(result[0].items[0].itemName, 'topic-missing');
    });
  });

  describe('findAllActive', () => {
    it('should filter by isActive true', async () => {
      prisma.lesson.findMany.mock.mockImplementation(async () => [baseLesson()]);

      await service.findAllActive();

      const args = prisma.lesson.findMany.mock.calls[0].arguments[0];
      assert.deepEqual(args.where, { isActive: true });
    });
  });

  describe('create', () => {
    it('should create a lesson with defaults applied', async () => {
      prisma.lesson.create.mock.mockImplementation(async () => baseLesson());

      const result = await service.create({
        titleHr: 'Naslov',
        titleRu: 'Заголовок',
        titleUk: 'Заголовок',
        titleEn: 'Title',
      });

      const args = prisma.lesson.create.mock.calls[0].arguments[0];
      assert.equal(args.data.sortOrder, 0);
      assert.equal(args.data.isActive, true);
      assert.equal(args.data.descriptionHr, null);
      assert.equal(result.id, 'lesson1');
    });

    it('should preserve explicit sortOrder and isActive values', async () => {
      prisma.lesson.create.mock.mockImplementation(async () =>
        baseLesson({ sortOrder: 5, isActive: false }),
      );

      await service.create({
        titleHr: 'A',
        titleRu: 'B',
        titleUk: 'C',
        titleEn: 'D',
        sortOrder: 5,
        isActive: false,
      });

      const args = prisma.lesson.create.mock.calls[0].arguments[0];
      assert.equal(args.data.sortOrder, 5);
      assert.equal(args.data.isActive, false);
    });
  });

  describe('update', () => {
    it('should update only provided fields', async () => {
      prisma.lesson.findUnique.mock.mockImplementation(async () => baseLesson());
      prisma.lesson.update.mock.mockImplementation(async () =>
        baseLesson({ titleEn: 'New Title' }),
      );

      const result = await service.update('lesson1', { titleEn: 'New Title' });

      const args = prisma.lesson.update.mock.calls[0].arguments[0];
      assert.deepEqual(args.data, { titleEn: 'New Title' });
      assert.equal(result.titleEn, 'New Title');
    });

    it('should throw NotFoundException when lesson does not exist', async () => {
      prisma.lesson.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.update('missing', {}), { name: 'NotFoundException' });
    });
  });

  describe('remove', () => {
    it('should delete an existing lesson', async () => {
      prisma.lesson.findUnique.mock.mockImplementation(async () => baseLesson());
      prisma.lesson.delete.mock.mockImplementation(async () => ({}));

      await service.remove('lesson1');

      assert.equal(prisma.lesson.delete.mock.callCount(), 1);
    });

    it('should throw NotFoundException when lesson does not exist', async () => {
      prisma.lesson.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.remove('missing'), { name: 'NotFoundException' });
    });
  });

  describe('addItem', () => {
    it('should add an exercise topic item and resolve its name', async () => {
      prisma.lesson.findUnique.mock.mockImplementation(async () => baseLesson());
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => ({ nameEn: 'Verbs' }));
      prisma.lessonItem.create.mock.mockImplementation(async () => ({
        id: 'item1',
        lessonId: 'lesson1',
        itemType: LessonItemType.EXERCISE_TOPIC,
        itemId: 'topic1',
        sortOrder: 0,
      }));

      const result = await service.addItem('lesson1', {
        itemType: LessonItemType.EXERCISE_TOPIC,
        itemId: 'topic1',
      });

      assert.equal(result.itemName, 'Verbs');
    });

    it('should add a dictionary collection item and resolve its name', async () => {
      prisma.lesson.findUnique.mock.mockImplementation(async () => baseLesson());
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => ({
        nameEn: 'Food',
      }));
      prisma.lessonItem.create.mock.mockImplementation(async () => ({
        id: 'item1',
        lessonId: 'lesson1',
        itemType: LessonItemType.DICTIONARY_COLLECTION,
        itemId: 'col1',
        sortOrder: 0,
      }));

      const result = await service.addItem('lesson1', {
        itemType: LessonItemType.DICTIONARY_COLLECTION,
        itemId: 'col1',
      });

      assert.equal(result.itemName, 'Food');
    });

    it('should throw NotFoundException when lesson does not exist', async () => {
      prisma.lesson.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(
        () =>
          service.addItem('missing', { itemType: LessonItemType.EXERCISE_TOPIC, itemId: 'topic1' }),
        { name: 'NotFoundException' },
      );
    });

    it('should throw NotFoundException when referenced exercise topic does not exist', async () => {
      prisma.lesson.findUnique.mock.mockImplementation(async () => baseLesson());
      prisma.exerciseTopic.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(
        () =>
          service.addItem('lesson1', {
            itemType: LessonItemType.EXERCISE_TOPIC,
            itemId: 'topic-missing',
          }),
        { name: 'NotFoundException' },
      );
      assert.equal(prisma.lessonItem.create.mock.callCount(), 0);
    });

    it('should throw NotFoundException when referenced dictionary collection does not exist', async () => {
      prisma.lesson.findUnique.mock.mockImplementation(async () => baseLesson());
      prisma.dictionaryCollection.findUnique.mock.mockImplementation(async () => null);

      await assert.rejects(
        () =>
          service.addItem('lesson1', {
            itemType: LessonItemType.DICTIONARY_COLLECTION,
            itemId: 'col-missing',
          }),
        { name: 'NotFoundException' },
      );
      assert.equal(prisma.lessonItem.create.mock.callCount(), 0);
    });
  });

  describe('removeItem', () => {
    it('should delete an existing lesson item', async () => {
      prisma.lessonItem.findFirst.mock.mockImplementation(async () => ({ id: 'item1' }));
      prisma.lessonItem.delete.mock.mockImplementation(async () => ({}));

      await service.removeItem('lesson1', 'item1');

      assert.equal(prisma.lessonItem.delete.mock.callCount(), 1);
    });

    it('should throw NotFoundException when item does not belong to the lesson', async () => {
      prisma.lessonItem.findFirst.mock.mockImplementation(async () => null);

      await assert.rejects(() => service.removeItem('lesson1', 'missing'), {
        name: 'NotFoundException',
      });
    });
  });
});
