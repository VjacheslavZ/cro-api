import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';

import { ResultsSummary } from '../../exercises/ui/ResultsSummary';

/**
 * Route: /dictionary/practice/results/:sessionId
 *
 * Results screen shown after completing a dictionary practice session. Displays
 * score, XP earned, and current streak. Navigates back to `state.backPath`
 * (defaults to /dictionary/my) via both action buttons.
 *
 * Reached from: DictionaryPracticePage on session completion.
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

export function DictionaryPracticeResultsPage() {
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
      <ResultsSummary title={t('dictionary.practice.results')} {...state}>
        <Button onClick={() => navigate(state.backPath ?? '/dictionary/my')}>
          {t('dictionary.practice.back')}
        </Button>
        <Button variant="outline" onClick={() => navigate(state.backPath ?? '/dictionary/my')}>
          {t('dictionary.practice.practiceAgain')}
        </Button>
      </ResultsSummary>
    </PageContainer>
  );
}
