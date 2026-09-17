import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';

import { ResultsSummary } from '../../exercises/ui/ResultsSummary';

/**
 * Route: /dictionary/review/results/:sessionId
 *
 * Results screen shown after completing an FSRS revision session. Displays
 * score, XP earned, and current streak. Navigates back to `state.backPath`
 * (defaults to /exercises/vocabulary) via both action buttons.
 *
 * Reached from: DictionaryReviewPage on session completion.
 * State is passed via React Router `location.state` — renders an error if
 * state is missing (e.g. direct navigation).
 */

interface ResultsLocationState {
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  currentStreak: number;
  backPath?: string;
}

export function DictionaryReviewResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;

  if (!state) {
    return (
      <PageContainer size="sm" className="py-8">
        <ErrorAlert />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="sm" className="py-8">
      <ResultsSummary title={t('dictionary.review.results')} {...state}>
        <Button onClick={() => navigate(state.backPath ?? '/exercises/vocabulary')}>
          {t('dictionary.review.back')}
        </Button>
      </ResultsSummary>
    </PageContainer>
  );
}
