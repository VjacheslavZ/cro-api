/**
 * @module SpeedQuizPage
 * @description Speed Quiz exercise: tests retention of fully-learned words under time pressure.
 * Shows a Croatian word + 3 answer options with a 5-second countdown per question.
 * Correct → stays at 100% progress, auto-advance 1s.
 * Incorrect/timeout → word added to retry queue, auto-advance 2s.
 * Second failure → word progress reset to 0% for all 4 exercise types.
 * Retry correct → word stays at 100%.
 * Progress outcomes submitted at session end via speedQuizOutcomes.
 * @usedBy AppRouter (/exercises/vocabulary/speed-quiz)
 */
import { useNavigate, useLocation } from 'react-router-dom';
import type { DictionaryPracticeItem } from '@cro/shared';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Spinner } from '@/components/Spinner';

import { StopExerciseDialog } from '../StopExerciseDialog';
import { ExerciseProgressHeader } from '../ExerciseProgressHeader';
import { useSpeedQuiz } from './useSpeedQuiz';
import { SpeedQuizCard } from './SpeedQuizCard';

interface LocationState {
  items: DictionaryPracticeItem[];
  totalQuestions: number;
  sessionId: string;
}

export function SpeedQuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const allItems = state?.items ?? [];
  const sessionId = state?.sessionId ?? '';

  const quiz = useSpeedQuiz(allItems, sessionId);

  if (!state || allItems.length === 0) {
    navigate('/exercises/vocabulary', { replace: true });
    return null;
  }

  return (
    <PageContainer size="sm" className="py-8">
      <ExerciseProgressHeader
        currentIndex={quiz.doneCount - 1}
        total={quiz.totalWords}
        progressValue={quiz.progressPercent}
        onStop={() => quiz.setStopOpen(true)}
      />

      {quiz.isError && <ErrorAlert className="mb-4" />}

      {quiz.isPending ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : quiz.currentItem ? (
        <SpeedQuizCard
          item={quiz.currentItem}
          options={quiz.options}
          phase={quiz.phase}
          selectedAnswer={quiz.selectedAnswer}
          timeLeft={quiz.timeLeft}
          timerClassName={quiz.timerClassName}
          onAnswer={quiz.handleAnswer}
        />
      ) : null}

      <StopExerciseDialog
        open={quiz.stopOpen}
        onClose={() => quiz.setStopOpen(false)}
        onConfirm={() => navigate('/exercises/vocabulary', { replace: true })}
      />
    </PageContainer>
  );
}
