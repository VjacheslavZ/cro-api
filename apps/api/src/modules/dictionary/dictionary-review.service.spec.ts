import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs';
import { FsrsRating } from '@cro/shared';

import { DictionaryReviewService } from './dictionary-review.service';
import { StartReviewDto } from './dto/start-review.dto';
import { FinishReviewDto } from './dto/finish-review.dto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

const scheduler = fsrs(generatorParameters({ request_retention: 0.9, enable_short_term: false }));

function newCardRow(now: Date) {
  const card = createEmptyCard(now);
  return {
    userId: 'user1',
    wordId: 'word1',
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: 'NEW',
    lastReview: null,
  };
}

function reviewedCardRow(now: Date) {
  const empty = createEmptyCard(now);
  const result = scheduler.next(empty, now, Rating.Good);
  return {
    userId: 'user1',
    wordId: 'word1',
    due: result.card.due,
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    elapsedDays: result.card.elapsed_days,
    scheduledDays: result.card.scheduled_days,
    reps: result.card.reps,
    lapses: result.card.lapses,
    state: 'REVIEW',
    lastReview: result.card.last_review,
  };
}

function createMockPrisma() {
  return {
    dictionaryWordProgress: {
      findUnique: mock.fn() as MockFn,
      findMany: mock.fn() as MockFn,
    },
    dictionaryWordReview: {
      findUnique: mock.fn() as MockFn,
      findMany: mock.fn() as MockFn,
      create: mock.fn() as MockFn,
      createMany: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
      count: mock.fn() as MockFn,
    },
    dictionaryReviewSession: {
      create: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
    },
    dictionaryReviewAnswer: {
      createMany: mock.fn(async () => ({ count: 0 })) as MockFn,
    },
  };
}

function createMockGamificationService() {
  return {
    awardXpAndUpdateStreak: mock.fn() as MockFn,
  };
}

describe('DictionaryReviewService', () => {
  let service: DictionaryReviewService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let gamificationService: ReturnType<typeof createMockGamificationService>;

  beforeEach(() => {
    prisma = createMockPrisma();
    gamificationService = createMockGamificationService();
    service = new DictionaryReviewService(prisma as never, gamificationService as never);
  });

  describe('seedIfLearned', () => {
    it('should do nothing when the word is not fully learned', async () => {
      prisma.dictionaryWordProgress.findUnique.mock.mockImplementation(async () => ({
        wordToTranslatePercent: 100,
        translateToWordPercent: 50,
        letterPickPercent: 100,
        matchingPercent: 100,
      }));

      await service.seedIfLearned('user1', 'word1');

      assert.equal(prisma.dictionaryWordReview.create.mock.callCount(), 0);
    });

    it('should do nothing when a review card already exists', async () => {
      prisma.dictionaryWordProgress.findUnique.mock.mockImplementation(async () => ({
        wordToTranslatePercent: 100,
        translateToWordPercent: 100,
        letterPickPercent: 100,
        matchingPercent: 100,
      }));
      prisma.dictionaryWordReview.findUnique.mock.mockImplementation(async () => ({
        id: 'existing-review',
      }));

      await service.seedIfLearned('user1', 'word1');

      assert.equal(prisma.dictionaryWordReview.create.mock.callCount(), 0);
    });

    it('should create a fresh NEW-state FSRS card when the word just became fully learned', async () => {
      prisma.dictionaryWordProgress.findUnique.mock.mockImplementation(async () => ({
        wordToTranslatePercent: 100,
        translateToWordPercent: 100,
        letterPickPercent: 100,
        matchingPercent: 100,
      }));
      prisma.dictionaryWordReview.findUnique.mock.mockImplementation(async () => null);

      await service.seedIfLearned('user1', 'word1');

      assert.equal(prisma.dictionaryWordReview.create.mock.callCount(), 1);
      const createArgs = prisma.dictionaryWordReview.create.mock.calls[0].arguments[0];
      assert.equal(createArgs.data.userId, 'user1');
      assert.equal(createArgs.data.wordId, 'word1');
      assert.equal(createArgs.data.state, 'NEW');
      assert.equal(createArgs.data.reps, 0);
      assert.equal(createArgs.data.lapses, 0);
    });
  });

  describe('seedAllLearnedWords', () => {
    it('should return 0 when there are no fully-learned words', async () => {
      prisma.dictionaryWordProgress.findMany.mock.mockImplementation(async () => []);

      const count = await service.seedAllLearnedWords();

      assert.equal(count, 0);
      assert.equal(prisma.dictionaryWordReview.createMany.mock.callCount(), 0);
    });

    it('should skip words that already have a review card', async () => {
      prisma.dictionaryWordProgress.findMany.mock.mockImplementation(async () => [
        { userId: 'user1', wordId: 'word1' },
        { userId: 'user1', wordId: 'word2' },
      ]);
      prisma.dictionaryWordReview.findMany.mock.mockImplementation(async () => [
        { wordId: 'word1' },
      ]);
      prisma.dictionaryWordReview.createMany.mock.mockImplementation(async () => ({ count: 1 }));

      const count = await service.seedAllLearnedWords();

      assert.equal(count, 1);
      const createManyArgs = prisma.dictionaryWordReview.createMany.mock.calls[0].arguments[0];
      assert.equal(createManyArgs.data.length, 1);
      assert.equal(createManyArgs.data[0].wordId, 'word2');
    });

    it('should return 0 without calling createMany when all words already have review cards', async () => {
      prisma.dictionaryWordProgress.findMany.mock.mockImplementation(async () => [
        { userId: 'user1', wordId: 'word1' },
      ]);
      prisma.dictionaryWordReview.findMany.mock.mockImplementation(async () => [
        { wordId: 'word1' },
      ]);

      const count = await service.seedAllLearnedWords();

      assert.equal(count, 0);
      assert.equal(prisma.dictionaryWordReview.createMany.mock.callCount(), 0);
    });
  });

  describe('getDueCount', () => {
    it('should return the count of due review cards', async () => {
      prisma.dictionaryWordReview.count.mock.mockImplementation(async () => 7);

      const count = await service.getDueCount('user1');

      assert.equal(count, 7);
      const args = prisma.dictionaryWordReview.count.mock.calls[0].arguments[0];
      assert.equal(args.where.userId, 'user1');
    });
  });

  describe('startSession', () => {
    it('should reject when there are no due cards', async () => {
      prisma.dictionaryWordReview.findMany.mock.mockImplementation(async () => []);

      const dto = {} as StartReviewDto;

      await assert.rejects(() => service.startSession('user1', dto), {
        name: 'NotFoundException',
      });
    });

    it('should preview all four rating outcomes for each due card', async () => {
      const now = new Date();
      const row = { ...newCardRow(now), word: { wordHr: 'kruh', translation: 'хлеб' } };
      prisma.dictionaryWordReview.findMany.mock.mockImplementation(async () => [row]);
      prisma.dictionaryReviewSession.create.mock.mockImplementation(async () => ({
        id: 'session1',
      }));

      const dto = { count: 20 } as StartReviewDto;
      const result = await service.startSession('user1', dto);

      assert.equal(result.sessionId, 'session1');
      assert.equal(result.totalQuestions, 1);
      assert.equal(result.items[0].wordId, 'word1');
      assert.equal(result.items[0].wordHr, 'kruh');
      assert.ok(typeof result.items[0].intervals.again === 'number');
      assert.ok(typeof result.items[0].intervals.hard === 'number');
      assert.ok(typeof result.items[0].intervals.good === 'number');
      assert.ok(typeof result.items[0].intervals.easy === 'number');
      assert.ok(result.items[0].intervals.easy >= result.items[0].intervals.again);
    });

    it('should respect the requested count when querying due cards', async () => {
      prisma.dictionaryWordReview.findMany.mock.mockImplementation(async () => []);

      try {
        await service.startSession('user1', { count: 5 } as StartReviewDto);
      } catch {
        // expected NotFoundException, we only care about the query args here
      }

      const findArgs = prisma.dictionaryWordReview.findMany.mock.calls[0].arguments[0];
      assert.equal(findArgs.take, 5);
    });
  });

  describe('finishSession', () => {
    it('should reject when session is not found', async () => {
      prisma.dictionaryReviewSession.findUnique.mock.mockImplementation(async () => null);

      const dto = { answers: [] } as FinishReviewDto;

      await assert.rejects(() => service.finishSession('user1', 'session1', dto), {
        name: 'NotFoundException',
      });
    });

    it('should reject finishing another user session', async () => {
      prisma.dictionaryReviewSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'other-user',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));

      const dto = { answers: [] } as FinishReviewDto;

      await assert.rejects(() => service.finishSession('user1', 'session1', dto), {
        name: 'ForbiddenException',
      });
    });

    it('should reject finishing an already-completed session', async () => {
      prisma.dictionaryReviewSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'COMPLETED',
        totalQuestions: 1,
      }));

      const dto = { answers: [] } as FinishReviewDto;

      await assert.rejects(() => service.finishSession('user1', 'session1', dto), {
        name: 'ForbiddenException',
      });
    });

    it('should count Good as correct and keep the card in REVIEW state (no LEARNING reached)', async () => {
      const now = new Date();
      const row = reviewedCardRow(now);
      prisma.dictionaryReviewSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      prisma.dictionaryWordReview.findUnique.mock.mockImplementation(async () => row);
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 10,
        xpTotal: 10,
        currentStreak: 1,
        longestStreak: 1,
      }));

      const dto = {
        answers: [{ wordId: 'word1', rating: FsrsRating.GOOD }],
      } as FinishReviewDto;

      const result = await service.finishSession('user1', 'session1', dto);

      assert.equal(result.correctAnswers, 1);
      assert.equal(prisma.dictionaryWordReview.update.mock.callCount(), 1);
      const updateArgs = prisma.dictionaryWordReview.update.mock.calls[0].arguments[0];
      assert.equal(updateArgs.data.state, 'REVIEW');
      assert.equal(updateArgs.data.lapses, 0);
    });

    it('should count Again as incorrect and increment lapses while staying in REVIEW state', async () => {
      const now = new Date();
      const row = reviewedCardRow(now);
      prisma.dictionaryReviewSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      prisma.dictionaryWordReview.findUnique.mock.mockImplementation(async () => row);
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 0,
        xpTotal: 0,
        currentStreak: 0,
        longestStreak: 0,
      }));

      const dto = {
        answers: [{ wordId: 'word1', rating: FsrsRating.AGAIN }],
      } as FinishReviewDto;

      const result = await service.finishSession('user1', 'session1', dto);

      assert.equal(result.correctAnswers, 0);
      const updateArgs = prisma.dictionaryWordReview.update.mock.calls[0].arguments[0];
      assert.equal(updateArgs.data.state, 'REVIEW');
      assert.equal(updateArgs.data.lapses, 1);
    });

    it('should count Hard and Easy as correct', async () => {
      const now = new Date();
      prisma.dictionaryReviewSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 2,
      }));
      prisma.dictionaryWordReview.findUnique.mock.mockImplementation(async (args: never) => {
        const wordId = (args as { where: { wordId: string } }).where.wordId;
        return { ...reviewedCardRow(now), wordId };
      });
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 10,
        xpTotal: 10,
        currentStreak: 1,
        longestStreak: 1,
      }));

      const dto = {
        answers: [
          { wordId: 'word-hard', rating: FsrsRating.HARD },
          { wordId: 'word-easy', rating: FsrsRating.EASY },
        ],
      } as FinishReviewDto;

      const result = await service.finishSession('user1', 'session1', dto);

      assert.equal(result.correctAnswers, 2);
    });

    it('should skip a review card owned by a different user', async () => {
      const now = new Date();
      prisma.dictionaryReviewSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      prisma.dictionaryWordReview.findUnique.mock.mockImplementation(async () => ({
        ...reviewedCardRow(now),
        userId: 'other-user',
      }));
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 0,
        xpTotal: 0,
        currentStreak: 0,
        longestStreak: 0,
      }));

      const dto = {
        answers: [{ wordId: 'word1', rating: FsrsRating.GOOD }],
      } as FinishReviewDto;

      const result = await service.finishSession('user1', 'session1', dto);

      assert.equal(result.correctAnswers, 0);
      assert.equal(prisma.dictionaryWordReview.update.mock.callCount(), 0);
      assert.equal(prisma.dictionaryReviewAnswer.createMany.mock.callCount(), 0);
    });

    it('should dedupe repeated wordIds and cap answers at the session totalQuestions', async () => {
      const now = new Date();
      prisma.dictionaryReviewSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      prisma.dictionaryWordReview.findUnique.mock.mockImplementation(async () =>
        reviewedCardRow(now),
      );
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 10,
        xpTotal: 10,
        currentStreak: 1,
        longestStreak: 1,
      }));

      const dto = {
        answers: [
          { wordId: 'word1', rating: FsrsRating.GOOD },
          { wordId: 'word1', rating: FsrsRating.AGAIN },
          { wordId: 'word2', rating: FsrsRating.GOOD },
        ],
      } as FinishReviewDto;

      const result = await service.finishSession('user1', 'session1', dto);

      assert.equal(prisma.dictionaryWordReview.findUnique.mock.callCount(), 1);
      assert.equal(result.correctAnswers, 1);
    });

    it('should mark the session completed and return gamification results', async () => {
      const now = new Date();
      prisma.dictionaryReviewSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      prisma.dictionaryWordReview.findUnique.mock.mockImplementation(async () =>
        reviewedCardRow(now),
      );
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 15,
        xpTotal: 115,
        currentStreak: 3,
        longestStreak: 5,
      }));

      const dto = {
        answers: [{ wordId: 'word1', rating: FsrsRating.EASY }],
      } as FinishReviewDto;

      const result = await service.finishSession('user1', 'session1', dto);

      assert.equal(prisma.dictionaryReviewSession.update.mock.callCount(), 1);
      const updateArgs = prisma.dictionaryReviewSession.update.mock.calls[0].arguments[0];
      assert.equal(updateArgs.data.status, 'COMPLETED');
      assert.equal(prisma.dictionaryReviewAnswer.createMany.mock.callCount(), 1);
      assert.equal(result.xpEarned, 15);
      assert.equal(result.newXpTotal, 115);
      assert.equal(result.currentStreak, 3);
      assert.equal(result.longestStreak, 5);
    });
  });
});
