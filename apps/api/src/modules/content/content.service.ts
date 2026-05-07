import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ExerciseType } from '@cro/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { ContentCacheService } from './content-cache.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateTypeTheAnswerItemDto } from './dto/create-type-the-answer-item.dto';
import { UpdateTypeTheAnswerItemDto } from './dto/update-type-the-answer-item.dto';
import { CreateFlashcardItemDto } from './dto/create-flashcard-item.dto';
import { UpdateFlashcardItemDto } from './dto/update-flashcard-item.dto';
import { CreateFillInBlankItemDto } from './dto/create-fill-in-blank-item.dto';
import { UpdateFillInBlankItemDto } from './dto/update-fill-in-blank-item.dto';
import { CreateBuildSentenceItemDto } from './dto/create-build-sentence-item.dto';
import { UpdateBuildSentenceItemDto } from './dto/update-build-sentence-item.dto';
import { UpdateBuildSentenceWordDto } from './dto/update-build-sentence-word.dto';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private cache: ContentCacheService,
  ) {}

  // --- Topics ---

  async getActiveTopics() {
    const cacheKey = 'content:topics';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const topics = await this.prisma.exerciseTopic.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { topicTypes: true },
    });

    const result = topics.map(({ topicTypes, ...topic }) => ({
      ...topic,
      exerciseTypes: topicTypes.map((tt) => tt.exerciseType),
    }));

    await this.cache.set(cacheKey, result);
    return result;
  }

  async getAllTopics() {
    const topics = await this.prisma.exerciseTopic.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { topicTypes: true },
    });

    return topics.map(({ topicTypes, ...topic }) => ({
      ...topic,
      exerciseTypes: topicTypes.map((tt) => tt.exerciseType),
    }));
  }

  async getTopicById(id: string) {
    const topic = await this.prisma.exerciseTopic.findUnique({
      where: { id },
      include: { topicTypes: true },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    const { topicTypes, ...rest } = topic;
    return {
      ...rest,
      exerciseTypes: topicTypes.map((tt) => tt.exerciseType),
    };
  }

  async createTopic(dto: CreateTopicDto) {
    const topic = await this.prisma.exerciseTopic.create({ data: dto });
    await this.cache.invalidate('content:topics');
    return { ...topic, exerciseTypes: [] };
  }

  async updateTopic(id: string, dto: UpdateTopicDto) {
    await this.getTopicById(id);
    const topic = await this.prisma.exerciseTopic.update({
      where: { id },
      data: dto,
      include: { topicTypes: true },
    });
    await this.cache.invalidate('content:topics');
    const { topicTypes, ...rest } = topic;
    return { ...rest, exerciseTypes: topicTypes.map((tt) => tt.exerciseType) };
  }

  async deleteTopic(id: string) {
    await this.getTopicById(id);
    const itemCount = await this.countTopicItems(id);
    if (itemCount > 0) {
      throw new ConflictException('Remove all items first');
    }
    await this.prisma.exerciseTopic.delete({ where: { id } });
    await this.cache.invalidate('content:topics');
  }

  // --- Topic Types ---

  async updateTopicTypes(
    topicId: string,
    configs: { exerciseType: ExerciseType; enabled: boolean }[],
  ) {
    await this.getTopicById(topicId);

    for (const config of configs) {
      if (config.enabled) {
        await this.prisma.exerciseTopicType.upsert({
          where: {
            topicId_exerciseType: { topicId, exerciseType: config.exerciseType },
          },
          update: {},
          create: { topicId, exerciseType: config.exerciseType },
        });
      } else {
        await this.prisma.exerciseTopicType.deleteMany({
          where: { topicId, exerciseType: config.exerciseType },
        });
      }
    }

    await this.cache.invalidate('content:topics');
    return this.getTopicById(topicId);
  }
  // --- Type The Answer Items ---
  async getTypeTheAnswerItems(topicId: string) {
    return this.prisma.typeTheAnswerItem.findMany({
      where: { topicId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createTypeTheAnswerItem(dto: CreateTypeTheAnswerItemDto) {
    await this.getTopicById(dto.topicId);
    const duplicate = await this.prisma.typeTheAnswerItem.findUnique({
      where: { baseForm: dto.baseForm },
    });
    if (duplicate) {
      throw new ConflictException('Item with this baseForm already exists');
    }
    const item = await this.prisma.typeTheAnswerItem.create({ data: dto });
    await this.invalidateItemsCache(dto.topicId, ExerciseType.TYPE_THE_ANSWER);
    return item;
  }

  async updateTypeTheAnswerItem(id: string, dto: UpdateTypeTheAnswerItemDto) {
    const existing = await this.prisma.typeTheAnswerItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Type the answer item not found');
    if (dto.baseForm && dto.baseForm !== existing.baseForm) {
      const duplicate = await this.prisma.typeTheAnswerItem.findUnique({
        where: { baseForm: dto.baseForm },
      });
      if (duplicate) {
        throw new ConflictException('Item with this baseForm already exists');
      }
    }
    const item = await this.prisma.typeTheAnswerItem.update({ where: { id }, data: dto });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.TYPE_THE_ANSWER);
    return item;
  }

  async deleteTypeTheAnswerItem(id: string) {
    const existing = await this.prisma.typeTheAnswerItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Type the answer item not found');
    await this.prisma.typeTheAnswerItem.delete({ where: { id } });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.TYPE_THE_ANSWER);
  }

  // --- Flashcard Items ---
  async getFlashcardItems(topicId: string) {
    return this.prisma.flashcardItem.findMany({
      where: { topicId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createFlashcardItem(dto: CreateFlashcardItemDto) {
    await this.getTopicById(dto.topicId);
    const item = await this.prisma.flashcardItem.create({ data: dto });
    await this.invalidateItemsCache(dto.topicId, ExerciseType.FLASHCARDS);
    return item;
  }

  async updateFlashcardItem(id: string, dto: UpdateFlashcardItemDto) {
    const existing = await this.prisma.flashcardItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Flashcard item not found');
    const item = await this.prisma.flashcardItem.update({ where: { id }, data: dto });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.FLASHCARDS);
    return item;
  }

  async deleteFlashcardItem(id: string) {
    const existing = await this.prisma.flashcardItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Flashcard item not found');
    await this.prisma.flashcardItem.delete({ where: { id } });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.FLASHCARDS);
  }

  // --- Fill In Blank Items ---
  async getFillInBlankItems(topicId: string) {
    return this.prisma.fillInBlankItem.findMany({
      where: { topicId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createFillInBlankItem(dto: CreateFillInBlankItemDto) {
    await this.getTopicById(dto.topicId);
    const item = await this.prisma.fillInBlankItem.create({ data: dto });
    await this.invalidateItemsCache(dto.topicId, ExerciseType.FILL_IN_BLANK);
    return item;
  }

  async updateFillInBlankItem(id: string, dto: UpdateFillInBlankItemDto) {
    const existing = await this.prisma.fillInBlankItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fill in blank item not found');
    const item = await this.prisma.fillInBlankItem.update({ where: { id }, data: dto });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.FILL_IN_BLANK);
    return item;
  }

  async deleteFillInBlankItem(id: string) {
    const existing = await this.prisma.fillInBlankItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fill in blank item not found');
    await this.prisma.fillInBlankItem.delete({ where: { id } });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.FILL_IN_BLANK);
  }

  // --- Build Sentence Items ---

  async getBuildSentenceItems(topicId: string) {
    return this.prisma.buildSentenceItem.findMany({
      where: { topicId },
      include: { words: { orderBy: { position: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createBuildSentenceItem(dto: CreateBuildSentenceItemDto) {
    await this.getTopicById(dto.topicId);
    const { words, topicId, ...itemData } = dto;
    const item = await this.prisma.buildSentenceItem.create({
      data: {
        ...itemData,
        topicId,
        words: {
          create: words.map((w) => ({
            wordHr: w.wordHr,
            position: w.position,
            distractors: w.distractors,
          })),
        },
      },
      include: { words: { orderBy: { position: 'asc' } } },
    });
    await this.invalidateItemsCache(topicId, ExerciseType.BUILD_SENTENCE);
    return item;
  }

  async updateBuildSentenceItem(id: string, dto: UpdateBuildSentenceItemDto) {
    const existing = await this.prisma.buildSentenceItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Build sentence item not found');

    const { words, ...itemData } = dto;

    if (words !== undefined) {
      await this.prisma.buildSentenceWord.deleteMany({ where: { itemId: id } });
      await this.prisma.buildSentenceWord.createMany({
        data: words.map((w) => ({
          itemId: id,
          wordHr: w.wordHr,
          position: w.position,
          distractors: w.distractors,
        })),
      });
    }

    const item = await this.prisma.buildSentenceItem.update({
      where: { id },
      data: itemData,
      include: { words: { orderBy: { position: 'asc' } } },
    });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.BUILD_SENTENCE);
    return item;
  }

  async updateBuildSentenceWord(wordId: string, dto: UpdateBuildSentenceWordDto) {
    const existing = await this.prisma.buildSentenceWord.findUnique({ where: { id: wordId } });
    if (!existing) throw new NotFoundException('Build sentence word not found');
    return this.prisma.buildSentenceWord.update({
      where: { id: wordId },
      data: { distractors: dto.distractors },
    });
  }

  async deleteBuildSentenceItem(id: string) {
    const existing = await this.prisma.buildSentenceItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Build sentence item not found');
    await this.prisma.buildSentenceItem.delete({ where: { id } });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.BUILD_SENTENCE);
  }

  // --- Generic Item Access (used by exercises/progress modules) ---

  async getItemsForTopic(
    topicId: string,
    exerciseType: ExerciseType,
  ): Promise<Record<string, unknown>[]> {
    const cacheKey = `content:topic:${topicId}:items:${exerciseType}`;
    const cached = await this.cache.get<Record<string, unknown>[]>(cacheKey);
    if (cached) return cached;

    const items = await this.queryItemsByType(topicId, exerciseType);
    await this.cache.set(cacheKey, items);

    return items;
  }

  async getItemsByIds(
    exerciseType: ExerciseType,
    itemIds: string[],
  ): Promise<Record<string, unknown>[]> {
    if (itemIds.length === 0) return [];

    switch (exerciseType) {
      case ExerciseType.TYPE_THE_ANSWER:
        return this.prisma.typeTheAnswerItem.findMany({
          where: { id: { in: itemIds } },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.FLASHCARDS:
        return this.prisma.flashcardItem.findMany({
          where: { id: { in: itemIds } },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.FILL_IN_BLANK:
        return this.prisma.fillInBlankItem.findMany({
          where: { id: { in: itemIds } },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.BUILD_SENTENCE:
        return this.getBuildSentenceItemsWithOptions(itemIds);
    }
  }

  // --- Private Helpers ---

  private async queryItemsByType(topicId: string, exerciseType: ExerciseType) {
    switch (exerciseType) {
      case ExerciseType.TYPE_THE_ANSWER:
        return this.prisma.typeTheAnswerItem.findMany({
          where: { topicId },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.FLASHCARDS:
        return this.prisma.flashcardItem.findMany({
          where: { topicId },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.FILL_IN_BLANK:
        return this.prisma.fillInBlankItem.findMany({
          where: { topicId },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.BUILD_SENTENCE:
        return this.prisma.buildSentenceItem.findMany({
          where: { topicId },
          orderBy: { sortOrder: 'asc' },
        });
    }
  }

  private async getBuildSentenceItemsWithOptions(
    itemIds: string[],
  ): Promise<Record<string, unknown>[]> {
    const items = await this.prisma.buildSentenceItem.findMany({
      where: { id: { in: itemIds } },
      include: { words: { orderBy: { position: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });

    const allWords = items.flatMap((item) => item.words.map((w) => w.wordHr));
    const uniqueWords = [...new Set(allWords)];

    return items.map((item) => ({
      ...item,
      words: item.words.map((word) => {
        const pool = [word.wordHr, ...word.distractors];
        if (pool.length < 6) {
          const candidates = uniqueWords.filter((w) => !pool.includes(w));
          this.shuffleArray(candidates);
          pool.push(...candidates.slice(0, 6 - pool.length));
        }
        return {
          id: word.id,
          wordHr: word.wordHr,
          position: word.position,
          options: this.shuffleArray([...pool.slice(0, 6)]),
        };
      }),
    }));
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private async countTopicItems(topicId: string): Promise<number> {
    const [sp, fc, fib, bs] = await Promise.all([
      this.prisma.typeTheAnswerItem.count({ where: { topicId } }),
      this.prisma.flashcardItem.count({ where: { topicId } }),
      this.prisma.fillInBlankItem.count({ where: { topicId } }),
      this.prisma.buildSentenceItem.count({ where: { topicId } }),
    ]);
    return sp + fc + fib + bs;
  }

  private async invalidateItemsCache(topicId: string, exerciseType: ExerciseType) {
    await this.cache.invalidate(`content:topic:${topicId}:items:${exerciseType}`);
  }
}
