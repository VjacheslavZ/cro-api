import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { DictionaryPracticeService } from './dictionary-practice.service';
import { StartPracticeDto } from './dto/start-practice.dto';
import { FinishPracticeDto } from './dto/finish-practice.dto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    userDictionaryWord: {
      findMany: mock.fn() as MockFn,
    },
    dictionaryPracticeSession: {
      create: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
    },
    dictionaryPracticeAnswer: {
      createMany: mock.fn(async () => ({ count: 0 })) as MockFn,
    },
    dictionaryWordProgress: {
      findUnique: mock.fn(async () => null) as MockFn,
      upsert: mock.fn(async () => ({})) as MockFn,
    },
  };
}

function createMockGamificationService() {
  return {
    awardXpAndUpdateStreak: mock.fn() as MockFn,
  };
}

function createMockReviewService() {
  return {
    seedIfLearned: mock.fn(async () => {}) as MockFn,
  };
}

describe('DictionaryPracticeService', () => {
  let service: DictionaryPracticeService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let gamificationService: ReturnType<typeof createMockGamificationService>;
  let reviewService: ReturnType<typeof createMockReviewService>;

  beforeEach(() => {
    prisma = createMockPrisma();
    gamificationService = createMockGamificationService();
    reviewService = createMockReviewService();
    service = new DictionaryPracticeService(
      prisma as never,
      gamificationService as never,
      reviewService as never,
    );
  });

  describe('startSession', () => {
    it('should start a Speed Quiz session with fully-learned words', async () => {
      const words = Array.from({ length: 12 }, (_, i) => ({
        id: `word${i}`,
        wordHr: `hrWord${i}`,
        translation: `translation${i}`,
      }));
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => words);
      prisma.dictionaryPracticeSession.create.mock.mockImplementation(async () => ({
        id: 'session1',
      }));

      const dto = { learnedOnly: true } as StartPracticeDto;
      const result = await service.startSession('user1', dto);

      assert.equal(result.sessionId, 'session1');
      assert.equal(result.totalQuestions, 12);
      assert.equal(result.items.length, 12);
      const createArgs = prisma.userDictionaryWord.findMany.mock.calls[0].arguments[0];
      assert.deepEqual(createArgs.where.progress, {
        wordToTranslatePercent: 100,
        translateToWordPercent: 100,
        letterPickPercent: 100,
        matchingPercent: 100,
      });
    });

    it('should reject Speed Quiz when fewer than 12 learned words are available', async () => {
      const words = Array.from({ length: 5 }, (_, i) => ({
        id: `word${i}`,
        wordHr: `hrWord${i}`,
        translation: `translation${i}`,
      }));
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => words);

      const dto = { learnedOnly: true } as StartPracticeDto;

      await assert.rejects(() => service.startSession('user1', dto), {
        name: 'NotFoundException',
      });
    });

    it('should start a session with explicitly selected wordIds', async () => {
      const words = [
        { id: 'word1', wordHr: 'kruh', translation: 'хлеб' },
        { id: 'word2', wordHr: 'voda', translation: 'вода' },
      ];
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => words);
      prisma.dictionaryPracticeSession.create.mock.mockImplementation(async () => ({
        id: 'session2',
      }));

      const dto = { wordIds: ['word1', 'word2'] } as StartPracticeDto;
      const result = await service.startSession('user1', dto);

      assert.equal(result.sessionId, 'session2');
      assert.equal(result.totalQuestions, 2);
      assert.equal(result.items[0].wordHr, 'kruh');
    });

    it('should reject when none of the requested wordIds are found', async () => {
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => []);

      const dto = { wordIds: ['missing1'] } as StartPracticeDto;

      await assert.rejects(() => service.startSession('user1', dto), {
        name: 'NotFoundException',
      });
    });

    it('should reject when no words are available for the default flow', async () => {
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => []);

      const dto = {} as StartPracticeDto;

      await assert.rejects(() => service.startSession('user1', dto), {
        name: 'NotFoundException',
      });
    });

    it('should sort by newest first when filter=newest', async () => {
      const words = [
        {
          id: 'old',
          wordHr: 'old',
          translation: 't',
          createdAt: new Date('2026-01-01'),
          progress: null,
        },
        {
          id: 'new',
          wordHr: 'new',
          translation: 't',
          createdAt: new Date('2026-02-01'),
          progress: null,
        },
      ];
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => words);
      prisma.dictionaryPracticeSession.create.mock.mockImplementation(async () => ({
        id: 'session3',
      }));

      const dto = { filter: 'newest', count: 10 } as StartPracticeDto;
      const result = await service.startSession('user1', dto);

      assert.equal(result.items[0].wordHr, 'new');
      assert.equal(result.items[1].wordHr, 'old');
    });

    it('should sort by oldest first when filter=oldest', async () => {
      const words = [
        {
          id: 'new',
          wordHr: 'new',
          translation: 't',
          createdAt: new Date('2026-02-01'),
          progress: null,
        },
        {
          id: 'old',
          wordHr: 'old',
          translation: 't',
          createdAt: new Date('2026-01-01'),
          progress: null,
        },
      ];
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => words);
      prisma.dictionaryPracticeSession.create.mock.mockImplementation(async () => ({
        id: 'session4',
      }));

      const dto = { filter: 'oldest', count: 10 } as StartPracticeDto;
      const result = await service.startSession('user1', dto);

      assert.equal(result.items[0].wordHr, 'old');
      assert.equal(result.items[1].wordHr, 'new');
    });

    it('should sort by average progress ascending when filter=progress', async () => {
      const words = [
        {
          id: 'high',
          wordHr: 'high',
          translation: 't',
          createdAt: new Date(),
          progress: {
            wordToTranslatePercent: 100,
            translateToWordPercent: 100,
            letterPickPercent: 100,
            matchingPercent: 0,
          },
        },
        {
          id: 'low',
          wordHr: 'low',
          translation: 't',
          createdAt: new Date(),
          progress: null,
        },
      ];
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => words);
      prisma.dictionaryPracticeSession.create.mock.mockImplementation(async () => ({
        id: 'session5',
      }));

      const dto = { filter: 'progress', count: 10 } as StartPracticeDto;
      const result = await service.startSession('user1', dto);

      assert.equal(result.items[0].wordHr, 'low');
      assert.equal(result.items[1].wordHr, 'high');
    });

    it('should truncate results to the requested count', async () => {
      const words = Array.from({ length: 5 }, (_, i) => ({
        id: `word${i}`,
        wordHr: `hr${i}`,
        translation: 't',
        createdAt: new Date(),
        progress: null,
      }));
      prisma.userDictionaryWord.findMany.mock.mockImplementation(async () => words);
      prisma.dictionaryPracticeSession.create.mock.mockImplementation(async () => ({
        id: 'session6',
      }));

      const dto = { count: 2 } as StartPracticeDto;
      const result = await service.startSession('user1', dto);

      assert.equal(result.totalQuestions, 2);
      assert.equal(result.items.length, 2);
    });
  });

  describe('finishSession', () => {
    it('should reject when session is not found', async () => {
      prisma.dictionaryPracticeSession.findUnique.mock.mockImplementation(async () => null);

      const dto = { answers: [] } as FinishPracticeDto;

      await assert.rejects(() => service.finishSession('user1', 'session1', dto), {
        name: 'NotFoundException',
      });
    });

    it('should reject finishing another user session', async () => {
      prisma.dictionaryPracticeSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'other-user',
        status: 'IN_PROGRESS',
        totalQuestions: 2,
      }));

      const dto = { answers: [] } as FinishPracticeDto;

      await assert.rejects(() => service.finishSession('user1', 'session1', dto), {
        name: 'ForbiddenException',
      });
    });

    it('should reject finishing an already-completed session', async () => {
      prisma.dictionaryPracticeSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'COMPLETED',
        totalQuestions: 2,
      }));

      const dto = { answers: [] } as FinishPracticeDto;

      await assert.rejects(() => service.finishSession('user1', 'session1', dto), {
        name: 'ForbiddenException',
      });
    });

    it('should update per-exercise-type progress and seed FSRS review when exerciseType is given', async () => {
      prisma.dictionaryPracticeSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 2,
      }));
      prisma.dictionaryWordProgress.findUnique.mock.mockImplementation(async () => ({
        wordToTranslatePercent: 50,
      }));
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 10,
        xpTotal: 60,
        currentStreak: 1,
        longestStreak: 3,
      }));

      const dto = {
        answers: [
          { wordId: 'word1', givenAnswer: 'a', isCorrect: true },
          { wordId: 'word2', givenAnswer: 'b', isCorrect: false },
        ],
        exerciseType: 'word-to-translate',
      } as FinishPracticeDto;

      const result = await service.finishSession('user1', 'session1', dto);

      assert.equal(result.correctAnswers, 1);
      assert.equal(prisma.dictionaryWordProgress.upsert.mock.callCount(), 2);
      const firstUpsertArgs = prisma.dictionaryWordProgress.upsert.mock.calls[0].arguments[0];
      assert.equal(firstUpsertArgs.update.wordToTranslatePercent, 100);
      const secondUpsertArgs = prisma.dictionaryWordProgress.upsert.mock.calls[1].arguments[0];
      assert.equal(secondUpsertArgs.update.wordToTranslatePercent, 50);
      assert.equal(reviewService.seedIfLearned.mock.callCount(), 2);
      assert.equal(result.xpEarned, 10);
      assert.equal(result.newXpTotal, 60);
    });

    it('should clamp progress at 100 when already at 100', async () => {
      prisma.dictionaryPracticeSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      prisma.dictionaryWordProgress.findUnique.mock.mockImplementation(async () => ({
        letterPickPercent: 100,
      }));
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 5,
        xpTotal: 5,
        currentStreak: 1,
        longestStreak: 1,
      }));

      const dto = {
        answers: [{ wordId: 'word1', givenAnswer: 'a', isCorrect: true }],
        exerciseType: 'letter-pick',
      } as FinishPracticeDto;

      await service.finishSession('user1', 'session1', dto);

      const upsertArgs = prisma.dictionaryWordProgress.upsert.mock.calls[0].arguments[0];
      assert.equal(upsertArgs.update.letterPickPercent, 100);
    });

    it('should update legacy totalAttempts/correctAttempts when no exerciseType is given', async () => {
      prisma.dictionaryPracticeSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 5,
        xpTotal: 5,
        currentStreak: 1,
        longestStreak: 1,
      }));

      const dto = {
        answers: [{ wordId: 'word1', givenAnswer: 'a', isCorrect: true }],
      } as FinishPracticeDto;

      await service.finishSession('user1', 'session1', dto);

      assert.equal(prisma.dictionaryWordProgress.upsert.mock.callCount(), 1);
      const upsertArgs = prisma.dictionaryWordProgress.upsert.mock.calls[0].arguments[0];
      assert.deepEqual(upsertArgs.update.totalAttempts, { increment: 1 });
      assert.deepEqual(upsertArgs.update.correctAttempts, { increment: 1 });
      assert.equal(reviewService.seedIfLearned.mock.callCount(), 0);
    });

    it('should not increment correctAttempts for incorrect legacy answers', async () => {
      prisma.dictionaryPracticeSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 0,
        xpTotal: 0,
        currentStreak: 0,
        longestStreak: 0,
      }));

      const dto = {
        answers: [{ wordId: 'word1', givenAnswer: 'wrong', isCorrect: false }],
      } as FinishPracticeDto;

      await service.finishSession('user1', 'session1', dto);

      const upsertArgs = prisma.dictionaryWordProgress.upsert.mock.calls[0].arguments[0];
      assert.equal('correctAttempts' in upsertArgs.update, false);
    });

    it('should apply speed quiz progress targets', async () => {
      prisma.dictionaryPracticeSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 5,
        xpTotal: 5,
        currentStreak: 1,
        longestStreak: 1,
      }));

      const dto = {
        answers: [{ wordId: 'word1', givenAnswer: 'a', isCorrect: true }],
        speedQuizOutcomes: [{ wordId: 'word1', progressTarget: 0 }],
      } as FinishPracticeDto;

      await service.finishSession('user1', 'session1', dto);

      const upsertCalls = prisma.dictionaryWordProgress.upsert.mock.calls;
      const speedQuizCall = upsertCalls[upsertCalls.length - 1].arguments[0];
      assert.equal(speedQuizCall.update.wordToTranslatePercent, 0);
      assert.equal(speedQuizCall.update.matchingPercent, 0);
    });

    it('should mark the session as completed with correct totals', async () => {
      prisma.dictionaryPracticeSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));
      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 5,
        xpTotal: 5,
        currentStreak: 1,
        longestStreak: 1,
      }));

      const dto = {
        answers: [{ wordId: 'word1', givenAnswer: 'a', isCorrect: true }],
      } as FinishPracticeDto;

      await service.finishSession('user1', 'session1', dto);

      assert.equal(prisma.dictionaryPracticeSession.update.mock.callCount(), 1);
      const updateArgs = prisma.dictionaryPracticeSession.update.mock.calls[0].arguments[0];
      assert.equal(updateArgs.data.status, 'COMPLETED');
      assert.equal(updateArgs.data.correctAnswers, 1);
      assert.equal(updateArgs.data.xpEarned, 5);
    });
  });
});
