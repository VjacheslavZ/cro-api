import { Injectable, NotFoundException } from '@nestjs/common';
import { LessonItemType } from '@cro/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { AddLessonItemDto } from './dto/add-lesson-item.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const lessons = await this.prisma.lesson.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    return Promise.all(lessons.map((l) => this.enrichLesson(l)));
  }

  async findAllActive() {
    const lessons = await this.prisma.lesson.findMany({
      where: { isActive: true },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    return Promise.all(lessons.map((l) => this.enrichLesson(l)));
  }

  async create(dto: CreateLessonDto) {
    const lesson = await this.prisma.lesson.create({
      data: {
        titleHr: dto.titleHr,
        titleRu: dto.titleRu,
        titleUk: dto.titleUk,
        titleEn: dto.titleEn,
        descriptionHr: dto.descriptionHr ?? null,
        descriptionRu: dto.descriptionRu ?? null,
        descriptionUk: dto.descriptionUk ?? null,
        descriptionEn: dto.descriptionEn ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: { items: true },
    });
    return this.enrichLesson(lesson);
  }

  async update(id: string, dto: UpdateLessonDto) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Lesson ${id} not found`);

    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: {
        ...(dto.titleHr !== undefined && { titleHr: dto.titleHr }),
        ...(dto.titleRu !== undefined && { titleRu: dto.titleRu }),
        ...(dto.titleUk !== undefined && { titleUk: dto.titleUk }),
        ...(dto.titleEn !== undefined && { titleEn: dto.titleEn }),
        ...(dto.descriptionHr !== undefined && { descriptionHr: dto.descriptionHr }),
        ...(dto.descriptionRu !== undefined && { descriptionRu: dto.descriptionRu }),
        ...(dto.descriptionUk !== undefined && { descriptionUk: dto.descriptionUk }),
        ...(dto.descriptionEn !== undefined && { descriptionEn: dto.descriptionEn }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    return this.enrichLesson(lesson);
  }

  async remove(id: string) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Lesson ${id} not found`);
    await this.prisma.lesson.delete({ where: { id } });
  }

  async addItem(lessonId: string, dto: AddLessonItemDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException(`Lesson ${lessonId} not found`);

    await this.validateItemId(dto.itemType, dto.itemId);

    const item = await this.prisma.lessonItem.create({
      data: {
        lessonId,
        itemType: dto.itemType,
        itemId: dto.itemId,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    const itemName = await this.resolveItemName(dto.itemType, dto.itemId);
    return { ...item, itemName };
  }

  async removeItem(lessonId: string, itemId: string) {
    const item = await this.prisma.lessonItem.findFirst({
      where: { id: itemId, lessonId },
    });
    if (!item) throw new NotFoundException(`Item ${itemId} not found in lesson ${lessonId}`);
    await this.prisma.lessonItem.delete({ where: { id: itemId } });
  }

  private async enrichLesson(lesson: {
    id: string;
    titleHr: string;
    titleRu: string;
    titleUk: string;
    titleEn: string;
    descriptionHr: string | null;
    descriptionRu: string | null;
    descriptionUk: string | null;
    descriptionEn: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      lessonId: string;
      itemType: string;
      itemId: string;
      sortOrder: number;
      createdAt: Date;
    }>;
  }) {
    const topicIds = lesson.items
      .filter((i) => i.itemType === LessonItemType.EXERCISE_TOPIC)
      .map((i) => i.itemId);
    const collectionIds = lesson.items
      .filter((i) => i.itemType === LessonItemType.DICTIONARY_COLLECTION)
      .map((i) => i.itemId);

    const [topics, collections] = await Promise.all([
      topicIds.length > 0
        ? this.prisma.exerciseTopic.findMany({
            where: { id: { in: topicIds } },
            select: { id: true, nameEn: true },
          })
        : Promise.resolve([]),
      collectionIds.length > 0
        ? this.prisma.dictionaryCollection.findMany({
            where: { id: { in: collectionIds } },
            select: { id: true, nameEn: true },
          })
        : Promise.resolve([]),
    ]);

    const topicMap = new Map(topics.map((t) => [t.id, t.nameEn]));
    const collectionMap = new Map(collections.map((c) => [c.id, c.nameEn]));

    return {
      ...lesson,
      createdAt: lesson.createdAt.toISOString(),
      items: lesson.items.map((item) => ({
        ...item,
        itemName:
          item.itemType === LessonItemType.EXERCISE_TOPIC
            ? (topicMap.get(item.itemId) ?? item.itemId)
            : (collectionMap.get(item.itemId) ?? item.itemId),
      })),
    };
  }

  private async resolveItemName(itemType: LessonItemType, itemId: string): Promise<string> {
    if (itemType === LessonItemType.EXERCISE_TOPIC) {
      const topic = await this.prisma.exerciseTopic.findUnique({
        where: { id: itemId },
        select: { nameEn: true },
      });
      return topic?.nameEn ?? itemId;
    }
    const collection = await this.prisma.dictionaryCollection.findUnique({
      where: { id: itemId },
      select: { nameEn: true },
    });
    return collection?.nameEn ?? itemId;
  }

  private async validateItemId(itemType: LessonItemType, itemId: string) {
    if (itemType === LessonItemType.EXERCISE_TOPIC) {
      const exists = await this.prisma.exerciseTopic.findUnique({ where: { id: itemId } });
      if (!exists) throw new NotFoundException(`ExerciseTopic ${itemId} not found`);
    } else {
      const exists = await this.prisma.dictionaryCollection.findUnique({ where: { id: itemId } });
      if (!exists) throw new NotFoundException(`DictionaryCollection ${itemId} not found`);
    }
  }
}
