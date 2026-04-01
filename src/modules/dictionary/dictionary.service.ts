import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NativeLanguage } from '@cro/shared';
import { DICTIONARY_WORDS_PER_PAGE } from '@cro/shared/constants';

import { PrismaService } from '../../prisma/prisma.service';
import { AddWordDto } from './dto/add-word.dto';
import { GetWordsQueryDto } from './dto/get-words-query.dto';

@Injectable()
export class DictionaryService {
  constructor(private prisma: PrismaService) {}

  async getWords(userId: string, query: GetWordsQueryDto) {
    const limit = query.limit ?? DICTIONARY_WORDS_PER_PAGE;

    const where: Prisma.UserDictionaryWordWhereInput = {
      userId,
      ...(query.search ? { wordHr: { contains: query.search, mode: 'insensitive' as const } } : {}),
      ...(query.collectionId ? { collectionId: query.collectionId } : {}),
    };

    const words = await this.prisma.userDictionaryWord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        collection: { select: { name: true } },
        progress: { select: { totalAttempts: true, correctAttempts: true } },
      },
    });

    const hasMore = words.length > limit;
    if (hasMore) words.pop();

    const items = words.map((word) => ({
      id: word.id,
      wordHr: word.wordHr,
      translation: word.translation,
      translationLanguage: word.translationLanguage,
      collectionId: word.collectionId,
      collectionName: word.collection?.name ?? null,
      progressPercent:
        word.progress && word.progress.totalAttempts > 0
          ? Math.round((word.progress.correctAttempts / word.progress.totalAttempts) * 100)
          : 0,
      createdAt: word.createdAt.toISOString(),
    }));

    return {
      items,
      nextCursor: hasMore ? words[words.length - 1].id : null,
    };
  }

  async addWord(userId: string, dto: AddWordDto, nativeLanguage: NativeLanguage) {
    if (dto.collectionId) {
      await this.validateCollectionAccess(userId, dto.collectionId);
    }

    try {
      const word = await this.prisma.userDictionaryWord.create({
        data: {
          userId,
          wordHr: dto.wordHr,
          translation: dto.translation,
          translationLanguage: nativeLanguage,
          collectionId: dto.collectionId ?? null,
        },
      });

      await this.prisma.dictionaryWordProgress.create({
        data: {
          userId,
          wordId: word.id,
        },
      });

      return word;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This word is already in your dictionary');
      }
      throw error;
    }
  }

  async deleteWord(userId: string, wordId: string) {
    const word = await this.prisma.userDictionaryWord.findUnique({
      where: { id: wordId },
    });
    if (!word) throw new NotFoundException('Word not found');
    if (word.userId !== userId) throw new ForbiddenException();

    await this.prisma.userDictionaryWord.delete({ where: { id: wordId } });
  }

  async assignCollection(userId: string, wordId: string, collectionId: string | null) {
    const word = await this.prisma.userDictionaryWord.findUnique({
      where: { id: wordId },
    });
    if (!word) throw new NotFoundException('Word not found');
    if (word.userId !== userId) throw new ForbiddenException();

    if (collectionId) {
      await this.validateCollectionAccess(userId, collectionId);
    }

    return this.prisma.userDictionaryWord.update({
      where: { id: wordId },
      data: { collectionId },
    });
  }

  async batchAssignCollection(userId: string, wordIds: string[], collectionId: string | null) {
    if (collectionId) {
      await this.validateCollectionAccess(userId, collectionId);
    }

    await this.prisma.userDictionaryWord.updateMany({
      where: { id: { in: wordIds }, userId },
      data: { collectionId },
    });
  }

  async getSuggestions(wordHr: string, language: NativeLanguage) {
    const suggestions = await this.prisma.userDictionaryWord.groupBy({
      by: ['translation'],
      where: { wordHr, translationLanguage: language },
      _count: { translation: true },
      orderBy: { _count: { translation: 'desc' } },
      take: 5,
    });

    return suggestions.map((s) => ({
      translation: s.translation,
      count: s._count.translation,
    }));
  }

  private async validateCollectionAccess(userId: string, collectionId: string) {
    const collection = await this.prisma.dictionaryCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic && collection.createdByUserId !== userId) {
      throw new ForbiddenException('No access to this collection');
    }
  }
}
