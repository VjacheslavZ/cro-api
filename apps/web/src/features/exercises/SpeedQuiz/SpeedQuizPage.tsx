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
import { useTranslation } from 'react-i18next';
import { Container, LinearProgress, Alert, CircularProgress, Box } from '@mui/material';
import type { DictionaryPracticeItem } from '@cro/shared';

import { StopExerciseDialog } from '../StopExerciseDialog';
import { useSpeedQuiz } from './useSpeedQuiz';
import { SpeedQuizHeader } from './SpeedQuizHeader';
import { SpeedQuizCard } from './SpeedQuizCard';

interface LocationState {
  items: DictionaryPracticeItem[];
  totalQuestions: number;
  sessionId: string;
}

export function SpeedQuizPage() {
  const { t } = useTranslation();
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
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <SpeedQuizHeader
        doneCount={quiz.doneCount}
        totalWords={quiz.totalWords}
        onStop={() => quiz.setStopOpen(true)}
      />

      <LinearProgress
        variant="determinate"
        value={quiz.progressPercent}
        sx={{ mb: 3, height: 6, borderRadius: 3 }}
      />

      {quiz.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('common.error')}
        </Alert>
      )}

      {quiz.isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : quiz.currentItem ? (
        <SpeedQuizCard
          item={quiz.currentItem}
          options={quiz.options}
          phase={quiz.phase}
          selectedAnswer={quiz.selectedAnswer}
          timeLeft={quiz.timeLeft}
          timerColor={quiz.timerColor}
          onAnswer={quiz.handleAnswer}
        />
      ) : null}

      <StopExerciseDialog
        open={quiz.stopOpen}
        onClose={() => quiz.setStopOpen(false)}
        onConfirm={() => navigate('/exercises/vocabulary', { replace: true })}
      />
    </Container>
  );
}
