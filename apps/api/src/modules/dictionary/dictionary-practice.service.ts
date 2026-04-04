import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SessionStatus, DICTIONARY_PRACTICE_ITEMS } from '@cro/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { StartPracticeDto } from './dto/start-practice.dto';

@Injectable()
export class DictionaryPracticeService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  async startSession(userId: string, dto: StartPracticeDto) {
    const count = dto.count ?? DICTIONARY_PRACTICE_ITEMS;

    const words = await this.prisma.userDictionaryWord.findMany({
      where: {
        userId,
        ...(dto.collectionId ? { collectionId: dto.collectionId } : {}),
      },
      include: {
        progress: { select: { totalAttempts: true, correctAttempts: true } },
      },
    });

    if (words.length === 0) {
      throw new NotFoundException('No words available for practice');
    }

    // Sort by progress ratio ascending (least-known first), never-practiced first
    const sorted = words.sort((a, b) => {
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

    const selectedWords = sorted.slice(0, count);

    const session = await this.prisma.dictionaryPracticeSession.create({
      data: {
        userId,
        totalQuestions: selectedWords.length,
      },
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

  async finishSession(
    userId: string,
    sessionId: string,
    answers: { wordId: string; givenAnswer: string; isCorrect: boolean }[],
  ) {
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

    // Update progress for each answer
    for (const answer of answers) {
      await this.prisma.dictionaryWordProgress.updateMany({
        where: { userId, wordId: answer.wordId },
        data: {
          totalAttempts: { increment: 1 },
          ...(answer.isCorrect ? { correctAttempts: { increment: 1 } } : {}),
          lastPracticedAt: new Date(),
        },
      });
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
