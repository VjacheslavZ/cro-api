import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FsrsCardState } from '@prisma/client';
import { Card, Grade, Rating, State, createEmptyCard, fsrs, generatorParameters } from 'ts-fsrs';
import { SessionStatus, FsrsRating, DictionaryReviewInterval } from '@cro/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { StartReviewDto } from './dto/start-review.dto';
import { FinishReviewDto } from './dto/finish-review.dto';

const DB_TO_FSRS_STATE: Record<FsrsCardState, State> = {
  NEW: State.New,
  LEARNING: State.Learning,
  REVIEW: State.Review,
  RELEARNING: State.Relearning,
};

const FSRS_TO_DB_STATE: Record<State, FsrsCardState> = {
  [State.New]: FsrsCardState.NEW,
  [State.Learning]: FsrsCardState.LEARNING,
  [State.Review]: FsrsCardState.REVIEW,
  [State.Relearning]: FsrsCardState.RELEARNING,
};

interface ReviewRow {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: FsrsCardState;
  lastReview: Date | null;
}

@Injectable()
export class DictionaryReviewService {
  private scheduler = fsrs(
    generatorParameters({ request_retention: 0.9, enable_short_term: false }),
  );

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  private rowToCard(row: ReviewRow): Card {
    return {
      due: row.due,
      stability: row.stability,
      difficulty: row.difficulty,
      elapsed_days: row.elapsedDays,
      scheduled_days: row.scheduledDays,
      learning_steps: 0,
      reps: row.reps,
      lapses: row.lapses,
      state: DB_TO_FSRS_STATE[row.state],
      last_review: row.lastReview ?? undefined,
    };
  }

  private cardToRow(card: Card) {
    return {
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsed_days,
      scheduledDays: card.scheduled_days,
      reps: card.reps,
      lapses: card.lapses,
      state: FSRS_TO_DB_STATE[card.state],
      lastReview: card.last_review ?? null,
    };
  }

  /**
   * Seeds a fresh FSRS card the moment a word becomes fully learned (all 4 drill
   * percents at 100). No-op if the word isn't fully learned yet or already has a card.
   */
  async seedIfLearned(userId: string, wordId: string) {
    const progress = await this.prisma.dictionaryWordProgress.findUnique({
      where: { wordId },
      select: {
        wordToTranslatePercent: true,
        translateToWordPercent: true,
        letterPickPercent: true,
        matchingPercent: true,
      },
    });

    const isLearned =
      progress?.wordToTranslatePercent === 100 &&
      progress?.translateToWordPercent === 100 &&
      progress?.letterPickPercent === 100 &&
      progress?.matchingPercent === 100;

    if (!isLearned) return;

    const existing = await this.prisma.dictionaryWordReview.findUnique({
      where: { wordId },
      select: { id: true },
    });
    if (existing) return;

    const now = new Date();
    const card = createEmptyCard(now);

    await this.prisma.dictionaryWordReview.create({
      data: {
        userId,
        wordId,
        ...this.cardToRow(card),
      },
    });
  }

  /**
   * One-time backfill: seeds an FSRS card for every word that was already fully
   * learned (all 4 drill percents at 100) before this feature existed, so it
   * shows up in Revision without requiring the user to re-trigger the learned
   * transition. Safe to re-run — skips words that already have a card.
   */
  async seedAllLearnedWords(): Promise<number> {
    const learnedWords = await this.prisma.dictionaryWordProgress.findMany({
      where: {
        wordToTranslatePercent: 100,
        translateToWordPercent: 100,
        letterPickPercent: 100,
        matchingPercent: 100,
      },
      select: { userId: true, wordId: true },
    });

    if (learnedWords.length === 0) return 0;

    const existingReviews = await this.prisma.dictionaryWordReview.findMany({
      where: { wordId: { in: learnedWords.map((w) => w.wordId) } },
      select: { wordId: true },
    });
    const alreadySeeded = new Set(existingReviews.map((r) => r.wordId));

    const toSeed = learnedWords.filter((w) => !alreadySeeded.has(w.wordId));
    if (toSeed.length === 0) return 0;

    const now = new Date();
    const card = createEmptyCard(now);

    const { count } = await this.prisma.dictionaryWordReview.createMany({
      data: toSeed.map((w) => ({
        userId: w.userId,
        wordId: w.wordId,
        ...this.cardToRow(card),
      })),
      skipDuplicates: true,
    });

    return count;
  }

  async getDueCount(userId: string): Promise<number> {
    return this.prisma.dictionaryWordReview.count({
      where: { userId, due: { lte: new Date() } },
    });
  }

  async startSession(userId: string, dto: StartReviewDto) {
    const count = dto.count ?? 20;
    const now = new Date();

    const dueCards = await this.prisma.dictionaryWordReview.findMany({
      where: { userId, due: { lte: now } },
      orderBy: { due: 'asc' },
      take: count,
      include: { word: { select: { wordHr: true, translation: true } } },
    });

    if (dueCards.length === 0) {
      throw new NotFoundException('No words due for review');
    }

    const items = dueCards.map((row) => {
      const card = this.rowToCard(row);
      const preview = this.scheduler.repeat(card, now);
      const intervals: DictionaryReviewInterval = {
        again: preview[Rating.Again].card.scheduled_days,
        hard: preview[Rating.Hard].card.scheduled_days,
        good: preview[Rating.Good].card.scheduled_days,
        easy: preview[Rating.Easy].card.scheduled_days,
      };

      return {
        wordId: row.wordId,
        wordHr: row.word.wordHr,
        translation: row.word.translation,
        intervals,
      };
    });

    const session = await this.prisma.dictionaryReviewSession.create({
      data: { userId, totalQuestions: items.length },
    });

    return {
      sessionId: session.id,
      items,
      totalQuestions: items.length,
    };
  }

  async finishSession(userId: string, sessionId: string, dto: FinishReviewDto) {
    const session = await this.prisma.dictionaryReviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new ForbiddenException('Session already completed');
    }

    const now = new Date();
    let correctAnswers = 0;

    for (const answer of dto.answers) {
      const review = await this.prisma.dictionaryWordReview.findUnique({
        where: { wordId: answer.wordId },
      });
      if (!review || review.userId !== userId) continue;

      const card = this.rowToCard(review);
      const result = this.scheduler.next(card, now, answer.rating as Grade);

      await this.prisma.dictionaryWordReview.update({
        where: { wordId: answer.wordId },
        data: this.cardToRow(result.card),
      });

      if (answer.rating >= FsrsRating.HARD) correctAnswers += 1;
    }

    await this.prisma.dictionaryReviewAnswer.createMany({
      data: dto.answers.map((a) => ({
        sessionId,
        wordId: a.wordId,
        rating: a.rating,
      })),
    });

    const gamification = await this.gamificationService.awardXpAndUpdateStreak(
      userId,
      correctAnswers,
    );

    await this.prisma.dictionaryReviewSession.update({
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
