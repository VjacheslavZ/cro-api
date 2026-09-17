/**
 * @module LearnWordsResultsPage
 * @description Step 4 (final) of the Learn Words flow. Displays aggregated results from all
 * 4 exercise steps: total score, total XP earned, and current streak from the last step.
 * Offers "Learn Again" and "Back to Dictionary" actions.
 * @usedBy AppRouter (/exercises/vocabulary/learn/results)
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { FinishDictionaryPracticeResponse } from '@cro/shared';
import { CircleCheckIcon } from 'lucide-react';

import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface LocationState {
  allResults: FinishDictionaryPracticeResponse[];
  collectionId?: string;
}

/**
 * Renders aggregated results across all 4 Learn Words steps.
 * Redirects to setup if location state is missing (direct URL access).
 */
export function LearnWordsResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { allResults, collectionId } = (location.state as LocationState) ?? {};

  if (!allResults || allResults.length === 0) {
    navigate('/exercises/vocabulary/learn', { replace: true });
    return null;
  }

  const totalCorrect = allResults.reduce((sum, r) => sum + r.correctAnswers, 0);
  const totalQuestions = allResults.reduce((sum, r) => sum + r.totalQuestions, 0);
  const totalXp = allResults.reduce((sum, r) => sum + r.xpEarned, 0);
  const lastResult = allResults[allResults.length - 1];

  const dictionaryPath = collectionId
    ? `/dictionary/my?collectionId=${collectionId}`
    : '/dictionary/my';

  return (
    <PageContainer size="sm" className="py-8">
      <div className="mb-8 text-center">
        <CircleCheckIcon className="mx-auto mb-2 size-16 text-success" />
        <h1 className="text-3xl font-semibold">{t('exercises.learnWords.resultsTitle')}</h1>
      </div>

      <div className="mb-6 rounded-xl border bg-card p-6">
        <p className="mb-2 text-lg font-medium">
          {t('exercises.learnWords.totalScore', { correct: totalCorrect, total: totalQuestions })}
        </p>
        {totalXp > 0 && (
          <p className="text-primary">{t('exercises.results.xpEarned', { xp: totalXp })}</p>
        )}
        {lastResult.currentStreak > 0 && (
          <p className="text-sm text-muted-foreground">
            {t('exercises.results.streak_one', { count: lastResult.currentStreak })}
          </p>
        )}
      </div>

      <Separator className="mb-6" />

      <div className="flex flex-col gap-4">
        <Button
          size="lg"
          className="w-full"
          onClick={() =>
            navigate(
              collectionId
                ? `/exercises/vocabulary/learn?collectionId=${collectionId}`
                : '/exercises/vocabulary/learn',
            )
          }
        >
          {t('exercises.learnWords.learnAgain')}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => navigate(dictionaryPath)}
        >
          {t('exercises.learnWords.backToDictionary')}
        </Button>
      </div>
    </PageContainer>
  );
}
