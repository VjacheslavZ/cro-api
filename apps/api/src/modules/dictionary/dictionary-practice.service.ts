import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SessionStatus, DICTIONARY_PRACTICE_ITEMS } from '@cro/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { StartPracticeDto } from './dto/start-practice.dto';
import { FinishPracticeDto } from './dto/finish-practice.dto';

type ProgressColumn =
  | 'wordToTranslatePercent'
  | 'translateToWordPercent'
  | 'letterPickPercent'
  | 'matchingPercent';

function getProgressColumn(exerciseType: string): ProgressColumn {
  const map: Record<string, ProgressColumn> = {
    'word-to-translate': 'wordToTranslatePercent',
    'translate-to-word': 'translateToWordPercent',
    'letter-pick': 'letterPickPercent',
    matching: 'matchingPercent',
  };
  return map[exerciseType];
}

@Injectable()
export class DictionaryPracticeService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  async startSession(userId: string, dto: StartPracticeDto) {
    const count = dto.count ?? DICTIONARY_PRACTICE_ITEMS;

    // When wordIds are provided, use them directly (Learn Words flow)
    if (dto.wordIds && dto.wordIds.length > 0) {
      const words = await this.prisma.userDictionaryWord.findMany({
        where: { id: { in: dto.wordIds }, userId },
        include: {
          progress: {
            select: {
              wordToTranslatePercent: true,
              translateToWordPercent: true,
              letterPickPercent: true,
              matchingPercent: true,
            },
          },
        },
      });

      const unlearnedWords = words.filter(
        (w) =>
          !w.progress ||
          !(
            w.progress.wordToTranslatePercent === 100 &&
            w.progress.translateToWordPercent === 100 &&
            w.progress.letterPickPercent === 100 &&
            w.progress.matchingPercent === 100
          ),
      );

      if (unlearnedWords.length === 0) {
        throw new NotFoundException('No words available for practice');
      }

      const session = await this.prisma.dictionaryPracticeSession.create({
        data: { userId, totalQuestions: unlearnedWords.length },
      });

      return {
        sessionId: session.id,
        items: unlearnedWords.map((w) => ({
          wordId: w.id,
          wordHr: w.wordHr,
          translation: w.translation,
        })),
        totalQuestions: unlearnedWords.length,
      };
    }

    const words = await this.prisma.userDictionaryWord.findMany({
      where: {
        userId,
        ...(dto.collectionId ? { collectionId: dto.collectionId } : {}),
        NOT: {
          progress: {
            wordToTranslatePercent: 100,
            translateToWordPercent: 100,
            letterPickPercent: 100,
            matchingPercent: 100,
          },
        },
      },
      include: {
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

    if (words.length === 0) {
      throw new NotFoundException('No words available for practice');
    }

    let sorted = [...words];

    if (dto.filter === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (dto.filter === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (dto.filter === 'progress') {
      sorted.sort((a, b) => {
        const avgA = a.progress
          ? (a.progress.wordToTranslatePercent +
              a.progress.translateToWordPercent +
              a.progress.letterPickPercent +
              a.progress.matchingPercent) /
            4
          : 0;
        const avgB = b.progress
          ? (b.progress.wordToTranslatePercent +
              b.progress.translateToWordPercent +
              b.progress.letterPickPercent +
              b.progress.matchingPercent) /
            4
          : 0;
        return avgA - avgB;
      });
    } else {
      // Default: least-known first (legacy ratio sort)
      sorted.sort((a, b) => {
        const ratioA =
          a.progress && a.progress.totalAttempts > 0
            ? a.progress.correctAttempts / a.progress.totalAttempts
            : -1;
        const ratioB =
          b.progress && b.progress.totalAttempts > 0
            ? b.progress.correctAttempts / b.progress.totalAttempts
            : -1;
        return ratioA - ratioB;
      });
    }

    const selectedWords = sorted.slice(0, count);

    const session = await this.prisma.dictionaryPracticeSession.create({
      data: { userId, totalQuestions: selectedWords.length },
    });

    return {
      sessionId: session.id,
      items: selectedWords.map((w) => ({
        wordId: w.id,
        wordHr: w.wordHr,
        translation: w.translation,
      })),
      totalQuestions: selectedWords.length,
    };
  }

  async finishSession(userId: string, sessionId: string, dto: FinishPracticeDto) {
    const { answers, exerciseType } = dto;

    const session = await this.prisma.dictionaryPracticeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new ForbiddenException('Session already completed');
    }

    const correctAnswers = answers.filter((a) => a.isCorrect).length;

    // Save answers
    await this.prisma.dictionaryPracticeAnswer.createMany({
      data: answers.map((a) => ({
        sessionId,
        wordId: a.wordId,
        givenAnswer: a.givenAnswer,
        isCorrect: a.isCorrect,
      })),
    });

    if (exerciseType) {
      // Learn Words flow: update per-exercise-type progress (+25 correct, -25 incorrect, clamped 0–100)
      const column = getProgressColumn(exerciseType);

      for (const answer of answers) {
        const existing = await this.prisma.dictionaryWordProgress.findUnique({
          where: { wordId: answer.wordId },
          select: { [column]: true },
        });

        const currentValue = (existing?.[column] as unknown as number) ?? 0;
        const delta = answer.isCorrect ? 25 : -25;
        const newValue = Math.min(100, Math.max(0, currentValue + delta));

        await this.prisma.dictionaryWordProgress.upsert({
          where: { wordId: answer.wordId },
          create: {
            userId,
            wordId: answer.wordId,
            [column]: newValue,
            lastPracticedAt: new Date(),
          },
          update: { [column]: newValue, lastPracticedAt: new Date() },
        });
      }
    } else {
      // Legacy flow: update totalAttempts / correctAttempts
      for (const answer of answers) {
        await this.prisma.dictionaryWordProgress.upsert({
          where: { wordId: answer.wordId },
          create: {
            userId,
            wordId: answer.wordId,
            totalAttempts: 1,
            correctAttempts: answer.isCorrect ? 1 : 0,
            lastPracticedAt: new Date(),
          },
          update: {
            totalAttempts: { increment: 1 },
            ...(answer.isCorrect ? { correctAttempts: { increment: 1 } } : {}),
            lastPracticedAt: new Date(),
          },
        });
      }
    }

    // Award XP and update streak
    const gamification = await this.gamificationService.awardXpAndUpdateStreak(
      userId,
      correctAnswers,
    );

    // Update session
    await this.prisma.dictionaryPracticeSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        correctAnswers,
        xpEarned: gamification.xpEarned,
        completedAt: new Date(),
      },
    });

    return {
      sessionId,
      correctAnswers,
      totalQuestions: session.totalQuestions,
      xpEarned: gamification.xpEarned,
      newXpTotal: gamification.xpTotal,
      currentStreak: gamification.currentStreak,
      longestStreak: gamification.longestStreak,
    };
  }
}
