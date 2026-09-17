/**
 * @module SessionResultsPage
 * @description Results screen shown after a grammar exercise session completes.
 * Displays score, XP earned, and streak count. Reads results from router location state
 * (set by SessionPage on finish). Offers "Continue" (back to topic) and "Back to Exercises".
 * @usedBy AppRouter (/exercises/results/:sessionId)
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlameIcon, TrophyIcon } from 'lucide-react';

import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ResultsLocationState {
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  currentStreak: number;
  topicId?: string;
  exerciseType?: string;
}

/**
 * Renders the post-session results screen.
 * Redirects to /exercises if location state is missing (e.g. direct URL access).
 */
export function SessionResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;

  if (!state) {
    return (
      <PageContainer size="sm" className="py-8 text-center">
        <p>{t('common.error')}</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/exercises')}>
          {t('exercises.results.backToExercises')}
        </Button>
      </PageContainer>
    );
  }

  const { correctAnswers, totalQuestions, xpEarned, currentStreak, topicId, exerciseType } = state;

  return (
    <PageContainer size="sm" className="py-8">
      <Card>
        <CardContent className="py-8 text-center">
          <TrophyIcon className="mx-auto mb-4 size-16 text-xp" />

          <h1 className="mb-2 text-3xl font-semibold">{t('exercises.results.title')}</h1>

          <p className="mb-4 text-2xl">
            {t('exercises.results.score', {
              correct: correctAnswers,
              total: totalQuestions,
            })}
          </p>

          <p className="mb-4 text-3xl font-bold text-primary">
            {t('exercises.results.xpEarned', { xp: xpEarned })}
          </p>

          <div className="mb-6 flex items-center justify-center gap-2 text-lg font-medium">
            <FlameIcon className="size-5 text-streak" />
            {t('exercises.results.streak', { count: currentStreak })}
          </div>

          <div className="flex flex-col gap-4">
            {topicId && exerciseType && (
              <Button
                size="lg"
                onClick={() =>
                  navigate(`/exercises/${topicId}`, {
                    replace: true,
                    state: { autoStartExerciseType: exerciseType },
                  })
                }
              >
                {t('exercises.results.continue')}
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/exercises', { replace: true })}
            >
              {t('exercises.results.backToExercises')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
