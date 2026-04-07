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
import { CreatePredefinedWordDto } from './dto/create-predefined-word.dto';
import { UpdatePredefinedWordDto } from './dto/update-predefined-word.dto';

@Injectable()
export class DictionaryCollectionsService {
  constructor(private prisma: PrismaService) {}

  async getCollections(userId: string) {
    const [publicCollections, userCollections] = await Promise.all([
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
        orderBy: { name: 'asc' },
        include: { _count: { select: { words: true } } },
      }),
    ]);

    return [
      ...publicCollections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isPublic: c.isPublic,
        wordCount: c.words.length,
        predefinedWordCount: c._count.predefinedWords,
        type: 'predefined' as const,
      })),
      ...userCollections.map((c) => ({
        id: c.id,
        name: c.name,
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
        name: dto.name,
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
      name: c.name,
      description: c.description,
      isPublic: c.isPublic,
      sortOrder: c.sortOrder,
      wordCount: c._count.words,
      predefinedWordCount: c._count.predefinedWords,
    }));
  }

  async adminCreateCollection(adminId: string, dto: CreateCollectionDto) {
    return this.prisma.dictionaryCollection.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdByAdminId: adminId,
        isPublic: true,
      },
    });
  }

  async adminUpdateCollection(id: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.dictionaryCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic) throw new ForbiddenException('Not an admin collection');

    return this.prisma.dictionaryCollection.update({
      where: { id },
      data: dto,
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
