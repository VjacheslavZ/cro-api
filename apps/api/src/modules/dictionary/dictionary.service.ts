import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NativeLanguage } from '@cro/shared';
import { DICTIONARY_WORDS_PER_PAGE } from '@cro/shared';

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
      ...(query.excludeLearned
        ? {
            NOT: {
              progress: {
                wordToTranslatePercent: 100,
                translateToWordPercent: 100,
                letterPickPercent: 100,
                matchingPercent: 100,
              },
            },
          }
        : {}),
    };

    // progress sort requires fetching all matching words and sorting in JS
    // (Prisma doesn't support ordering by computed aggregate columns)
    const useProgressSort = query.sort === 'progress';

    const orderBy: Prisma.UserDictionaryWordOrderByWithRelationInput =
      query.sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const words = await this.prisma.userDictionaryWord.findMany({
      where,
      orderBy: useProgressSort ? undefined : orderBy,
      take: useProgressSort ? undefined : limit + 1,
      ...(query.cursor && !useProgressSort ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        collection: { select: { name: true } },
        progress: {
          select: {
            totalAttempts: true,
            correctAttempts: true,
            wordToTranslatePercent: true,
            translateToWordPercent: true,
            letterPickPercent: true,
            matchingPercent: true,
          },
        },
      },
    });

    const mapWord = (word: (typeof words)[number]) => {
      const p = word.progress;
      const wTT = p?.wordToTranslatePercent ?? 0;
      const tTW = p?.translateToWordPercent ?? 0;
      const lP = p?.letterPickPercent ?? 0;
      const mP = p?.matchingPercent ?? 0;
      const progressPercent = Math.round((wTT + tTW + lP + mP) / 4);

      return {
        id: word.id,
        wordHr: word.wordHr,
        translation: word.translation,
        translationLanguage: word.translationLanguage,
        collectionId: word.collectionId,
        collectionName: word.collection?.name ?? null,
        progressPercent,
        wordToTranslatePercent: wTT,
        translateToWordPercent: tTW,
        letterPickPercent: lP,
        matchingPercent: mP,
        isLearned: wTT === 100 && tTW === 100 && lP === 100 && mP === 100,
        createdAt: word.createdAt.toISOString(),
      };
    };

    if (useProgressSort) {
      const sorted = words.map(mapWord).sort((a, b) => a.progressPercent - b.progressPercent);

      // Apply cursor-based pagination manually
      let startIdx = 0;
      if (query.cursor) {
        const idx = sorted.findIndex((w) => w.id === query.cursor);
        if (idx !== -1) startIdx = idx + 1;
      }

      const page = sorted.slice(startIdx, startIdx + limit + 1);
      const hasMore = page.length > limit;
      if (hasMore) page.pop();

      return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
    }

    const hasMore = words.length > limit;
    if (hasMore) words.pop();

    return {
      items: words.map(mapWord),
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

  async addSet(
    userId: string,
    collectionId: string,
    nativeLanguage: NativeLanguage,
    wordIds?: string[],
  ) {
    const collection = await this.prisma.dictionaryCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection || !collection.isPublic) {
      throw new NotFoundException('Collection not found');
    }

    const predefinedWords = await this.prisma.predefinedDictionaryWord.findMany({
      where: {
        collectionId,
        ...(wordIds ? { id: { in: wordIds } } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (predefinedWords.length === 0) {
      return { addedCount: 0, skippedCount: 0 };
    }

    const existingWords = await this.prisma.userDictionaryWord.findMany({
      where: { userId, wordHr: { in: predefinedWords.map((w) => w.wordHr) } },
      select: { wordHr: true },
    });
    const existingSet = new Set(existingWords.map((w) => w.wordHr));

    const newWords = predefinedWords.filter((w) => !existingSet.has(w.wordHr));

    if (newWords.length === 0) {
      return { addedCount: 0, skippedCount: predefinedWords.length };
    }

    const translationKey =
      nativeLanguage === NativeLanguage.RU
        ? 'translationRu'
        : nativeLanguage === NativeLanguage.UK
          ? 'translationUk'
          : 'translationEn';

    await this.prisma.$transaction(async (tx) => {
      for (const word of newWords) {
        const created = await tx.userDictionaryWord.create({
          data: {
            userId,
            wordHr: word.wordHr,
            translation: word[translationKey],
            translationLanguage: nativeLanguage,
            collectionId,
          },
        });
        await tx.dictionaryWordProgress.create({
          data: { userId, wordId: created.id },
        });
      }
    });

    return { addedCount: newWords.length, skippedCount: existingSet.size };
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
