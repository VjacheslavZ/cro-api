import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DictionaryReviewItem, FsrsRating } from '@cro/shared';
import { SquareIcon } from 'lucide-react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { useAppDispatch } from '../../../store';
import { useFinishDictionaryReview } from '../../../api/dictionary.ts';
import { fetchMe } from '../../../api/auth.ts';
import { DictionaryReviewExercise } from '../../exercises/DictionaryReviewExercise/DictionaryReviewExercise.tsx';
import { StopExerciseDialog } from '../../exercises/StopExerciseDialog';

/**
 * Route: /dictionary/review/:sessionId
 *
 * Active FSRS revision session page. Renders one due word at a time, advancing
 * through the item list received via `location.state`. On the last item it
 * calls `finishReview`, awards XP/streak, and navigates to
 * DictionaryReviewResultsPage.
 *
 * Reached from: VocabularyPage "Revision" entry point.
 */

interface ReviewLocationState {
  items: DictionaryReviewItem[];
  totalQuestions: number;
  backPath?: string;
}

interface ReviewAnswer {
  wordId: string;
  rating: FsrsRating;
}

export function DictionaryReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const state = location.state as ReviewLocationState | null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<ReviewAnswer[]>([]);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const finishReview = useFinishDictionaryReview();

  const handleAnswer = useCallback(
    async (answer: ReviewAnswer) => {
      const updatedAnswers = [...answers, answer];
      setAnswers(updatedAnswers);

      if (!state) return;

      if (currentIndex + 1 >= state.items.length) {
        try {
          const result = await finishReview.mutateAsync({
            sessionId: sessionId!,
            answers: updatedAnswers,
          });
          dispatch(fetchMe());
          navigate(`/dictionary/review/results/${sessionId}`, {
            state: {
              correctAnswers: result.correctAnswers,
              totalQuestions: result.totalQuestions,
              xpEarned: result.xpEarned,
              currentStreak: result.currentStreak,
              backPath: state.backPath,
            },
            replace: true,
          });
        } catch {
          // Error handled by mutation state
        }
      } else {
        setRevealed(false);
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [answers, currentIndex, state, sessionId, finishReview, dispatch, navigate],
  );

  if (!state || !state.items || state.items.length === 0) {
    return (
      <PageContainer size="sm" className="py-8">
        <ErrorAlert />
      </PageContainer>
    );
  }

  const { items } = state;
  const currentItem = items[currentIndex];

  return (
    <PageContainer size="sm" className="py-8">
      <div className="mb-4 flex items-center gap-4">
        <Progress
          value={(currentIndex / items.length) * 100}
          aria-label={t('exercises.session.progress', {
            current: currentIndex + 1,
            total: items.length,
          })}
          className="flex-1 **:data-[slot=progress-track]:h-2"
        />
        <Button variant="ghost" size="sm" onClick={() => setStopDialogOpen(true)}>
          <SquareIcon data-icon="inline-start" />
          {t('exercises.session.stop')}
        </Button>
      </div>

      {finishReview.isError && <ErrorAlert className="mb-4" />}

      <DictionaryReviewExercise
        key={currentItem.wordId}
        item={currentItem}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onAnswer={handleAnswer}
      />

      <StopExerciseDialog
        open={stopDialogOpen}
        onClose={() => setStopDialogOpen(false)}
        onConfirm={() => navigate(state.backPath ?? '/exercises/vocabulary')}
      />
    </PageContainer>
  );
}
