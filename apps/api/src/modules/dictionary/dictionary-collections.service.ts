/**
 * @module DictionaryCollectionsService
 * @description Dictionary collections for students (predefined + personal) and for admins
 * (predefined collection CRUD and their PredefinedDictionaryWord lists, including batched CSV
 * import). Predefined collections are the ones with isPublic: true.
 * @usedBy DictionaryController, AdminDictionaryController
 */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AdminCreateCollectionDto } from './dto/admin-create-collection.dto';
import { AdminUpdateCollectionDto } from './dto/admin-update-collection.dto';
import { CreatePredefinedWordDto } from './dto/create-predefined-word.dto';
import { UpdatePredefinedWordDto } from './dto/update-predefined-word.dto';
import { ImportPredefinedWordsDto } from './dto/import-predefined-words.dto';

@Injectable()
export class DictionaryCollectionsService {
  constructor(private prisma: PrismaService) {}

  async getCollections(userId: string) {
    const [user, publicCollections, userCollections] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { nativeLanguage: true } }),
      this.prisma.dictionaryCollection.findMany({
        where: { isPublic: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { predefinedWords: true } },
          words: {
            where: { userId },
            select: { id: true },
          },
        },
      }),
      this.prisma.dictionaryCollection.findMany({
        where: { createdByUserId: userId },
        orderBy: { personalName: 'asc' },
        include: { _count: { select: { words: true } } },
      }),
    ]);

    const lang = user?.nativeLanguage ?? 'EN';

    const localizedName = (c: { nameRu: string; nameUk: string; nameEn: string }) => {
      if (lang === 'RU') return c.nameRu || c.nameEn;
      if (lang === 'UK') return c.nameUk || c.nameEn;
      return c.nameEn;
    };

    return [
      ...publicCollections.map((c) => ({
        id: c.id,
        name: localizedName(c),
        description: c.description,
        isPublic: c.isPublic,
        wordCount: c.words.length,
        predefinedWordCount: c._count.predefinedWords,
        type: 'predefined' as const,
      })),
      ...userCollections.map((c) => ({
        id: c.id,
        name: c.personalName,
        description: c.description,
        isPublic: c.isPublic,
        wordCount: c._count.words,
        type: 'personal' as const,
      })),
    ];
  }

  async getCollectionWords(collectionId: string) {
    const collection = await this.prisma.dictionaryCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic) throw new ForbiddenException('Not a predefined collection');

    return this.prisma.predefinedDictionaryWord.findMany({
      where: { collectionId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCollection(userId: string, dto: CreateCollectionDto) {
    const collection = await this.prisma.dictionaryCollection.create({
      data: {
        personalName: dto.name,
        description: dto.description,
        createdByUserId: userId,
        isPublic: false,
      },
    });
    return { ...collection, wordCount: 0, type: 'personal' as const };
  }

  async updateCollection(userId: string, id: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.dictionaryCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.createdByUserId !== userId) throw new ForbiddenException();

    return this.prisma.dictionaryCollection.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCollection(userId: string, id: string) {
    const collection = await this.prisma.dictionaryCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.createdByUserId !== userId) throw new ForbiddenException();

    await this.prisma.dictionaryCollection.delete({ where: { id } });
  }

  // --- Admin methods ---

  async adminGetCollections() {
    const collections = await this.prisma.dictionaryCollection.findMany({
      where: { isPublic: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { words: true, predefinedWords: true } } },
    });

    return collections.map((c) => ({
      id: c.id,
      nameRu: c.nameRu,
      nameUk: c.nameUk,
      nameEn: c.nameEn,
      description: c.description,
      isPublic: c.isPublic,
      sortOrder: c.sortOrder,
      wordCount: c._count.words,
      predefinedWordCount: c._count.predefinedWords,
    }));
  }

  async adminCreateCollection(adminId: string, dto: AdminCreateCollectionDto) {
    return this.prisma.dictionaryCollection.create({
      data: {
        personalName: '',
        nameRu: dto.nameRu,
        nameUk: dto.nameUk,
        nameEn: dto.nameEn,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        createdByAdminId: adminId,
        isPublic: true,
      },
    });
  }

  async adminUpdateCollection(id: string, dto: AdminUpdateCollectionDto) {
    const collection = await this.prisma.dictionaryCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic) throw new ForbiddenException('Not an admin collection');

    return this.prisma.dictionaryCollection.update({
      where: { id },
      data: {
        ...(dto.nameRu !== undefined ? { nameRu: dto.nameRu } : {}),
        ...(dto.nameUk !== undefined ? { nameUk: dto.nameUk } : {}),
        ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async adminDeleteCollection(id: string) {
    const collection = await this.prisma.dictionaryCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic) throw new ForbiddenException('Not an admin collection');

    await this.prisma.dictionaryCollection.delete({ where: { id } });
  }

  // --- Admin predefined words ---

  async adminGetCollectionWords(collectionId: string) {
    const collection = await this.prisma.dictionaryCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic) throw new ForbiddenException('Not an admin collection');

    return this.prisma.predefinedDictionaryWord.findMany({
      where: { collectionId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async adminAddCollectionWord(collectionId: string, dto: CreatePredefinedWordDto) {
    const collection = await this.prisma.dictionaryCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic) throw new ForbiddenException('Not an admin collection');

    try {
      return await this.prisma.predefinedDictionaryWord.create({
        data: {
          collectionId,
          wordHr: dto.wordHr,
          translationRu: dto.translationRu,
          translationUk: dto.translationUk,
          translationEn: dto.translationEn,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This word already exists in the collection');
      }
      throw error;
    }
  }

  /**
   * Bulk-inserts one batch of CSV rows into a predefined collection. New words are appended after
   * the collection's current highest sortOrder, in batch order. Words already in the collection, and
   * repeats of the same wordHr inside the batch, are skipped rather than updated, so re-sending a
   * batch after a failed import is safe.
   * @param collectionId - Target predefined collection
   * @param dto - ImportPredefinedWordsDto with up to IMPORT_PREDEFINED_WORDS_MAX_BATCH trimmed rows
   * @returns `{ created, skipped }` — rows inserted and rows skipped as duplicates
   */
  async adminImportCollectionWords(collectionId: string, dto: ImportPredefinedWordsDto) {
    const collection = await this.prisma.dictionaryCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic) throw new ForbiddenException('Not an admin collection');

    const uniqueRows = new Map<string, ImportPredefinedWordsDto['words'][number]>();
    for (const row of dto.words) {
      if (!uniqueRows.has(row.wordHr)) uniqueRows.set(row.wordHr, row);
    }

    const { _max } = await this.prisma.predefinedDictionaryWord.aggregate({
      where: { collectionId },
      _max: { sortOrder: true },
    });
    const firstSortOrder = (_max.sortOrder ?? -1) + 1;

    const { count } = await this.prisma.predefinedDictionaryWord.createMany({
      data: [...uniqueRows.values()].map((row, index) => ({
        collectionId,
        wordHr: row.wordHr,
        translationRu: row.translationRu,
        translationUk: row.translationUk,
        translationEn: row.translationEn,
        sortOrder: firstSortOrder + index,
      })),
      skipDuplicates: true,
    });

    return { created: count, skipped: dto.words.length - count };
  }

  async adminUpdateCollectionWord(wordId: string, dto: UpdatePredefinedWordDto) {
    const word = await this.prisma.predefinedDictionaryWord.findUnique({
      where: { id: wordId },
      include: { collection: { select: { isPublic: true } } },
    });
    if (!word) throw new NotFoundException('Word not found');
    if (!word.collection.isPublic) throw new ForbiddenException('Not an admin collection');

    return this.prisma.predefinedDictionaryWord.update({
      where: { id: wordId },
      data: dto,
    });
  }

  async adminDeleteCollectionWord(wordId: string) {
    const word = await this.prisma.predefinedDictionaryWord.findUnique({
      where: { id: wordId },
      include: { collection: { select: { isPublic: true } } },
    });
    if (!word) throw new NotFoundException('Word not found');
    if (!word.collection.isPublic) throw new ForbiddenException('Not an admin collection');

    await this.prisma.predefinedDictionaryWord.delete({ where: { id: wordId } });
  }
}
