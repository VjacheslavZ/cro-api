/**
 * @module SessionPage
 * @description Grammar exercise session orchestrator. Receives items and session metadata
 * from router location state (set by TopicExercisesPage), steps through one item at a time,
 * collects answers, and submits them all at once on the final item via useFinishSession.
 * Dispatches fetchMe() after finish to refresh XP/streak — must happen AFTER navigation
 * to avoid AuthGuard unmounting this component mid-session.
 * Supports optional grammar rules dialog (ExerciseRulesDialog) when topic has rulesHtml.
 * @usedBy AppRouter (/exercises/session/:sessionId)
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
} from '@mui/material';
import type { ExerciseItem } from '@cro/shared';

import { useAppDispatch } from '../../store';
import { useFinishSession } from '../../api/exercises';
import { fetchMe } from '../../api/auth';
import { TypeTheAnswerExercise } from './TypeTheAnswerExercise/TypeTheAnswerExercise.tsx';
import { FlashcardExercise } from './FlashcardExercise/FlashcardExercise.tsx';
import { FillInBlankExercise } from './FillInBlankExercise/FillInBlankExercise.tsx';
import { ExerciseRulesDialog } from './ExerciseRulesDialog';
import { ExerciseProgressHeader } from './ExerciseProgressHeader';

interface SessionLocationState {
  items: ExerciseItem[];
  exerciseType: string;
  totalQuestions: number;
  rulesHtml: string | null;
}

interface SessionAnswer {
  itemId: string;
  givenAnswer: string;
  isCorrect: boolean;
}

/**
 * Renders the active exercise session, dispatching the correct exercise component
 * based on exerciseType from location state (TYPE_THE_ANSWER, FLASHCARDS, FILL_IN_BLANK).
 * Redirects to an error state if location state is missing (direct URL access).
 */
export function SessionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const state = location.state as SessionLocationState | null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const finishSession = useFinishSession();

  const handleAnswer = useCallback(
    async (answer: SessionAnswer) => {
      const updatedAnswers = [...answers, answer];
      setAnswers(updatedAnswers);

      if (!state) return;

      if (currentIndex + 1 >= state.items.length) {
        try {
          const result = await finishSession.mutateAsync({
            sessionId: sessionId!,
            answers: updatedAnswers,
          });
          dispatch(fetchMe());
          navigate(`/exercises/results/${sessionId}`, {
            state: {
              correctAnswers: result.correctAnswers,
              totalQuestions: result.totalQuestions,
              xpEarned: result.xpEarned,
              currentStreak: result.currentStreak,
              topicId: state.items[0]?.topicId,
              exerciseType: state.exerciseType,
            },
            replace: true,
          });
        } catch {
          // Error handled by mutation state
        }
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [answers, currentIndex, state, sessionId, finishSession, dispatch, navigate],
  );

  if (!state || !state.items || state.items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Container>
    );
  }

  const { items, exerciseType, rulesHtml } = state;
  const currentItem = items[currentIndex];

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
        minHeight: 'calc(100vh - 64px)',
        py: 6,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 672, mx: 'auto' }}>
        <ExerciseProgressHeader
          currentIndex={currentIndex}
          total={items.length}
          onStop={() => setStopOpen(true)}
          onShowRules={rulesHtml ? () => setRulesOpen(true) : undefined}
        />

        {finishSession.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('common.error')}
          </Alert>
        )}

        <Box>
          {exerciseType === 'TYPE_THE_ANSWER' && (
            <TypeTheAnswerExercise
              key={currentItem.id}
              item={currentItem as ExerciseItem & { type: 'TYPE_THE_ANSWER' }}
              onAnswer={handleAnswer}
              isLast={currentIndex + 1 >= items.length}
            />
          )}
          {exerciseType === 'FLASHCARDS' && (
            <FlashcardExercise
              key={currentItem.id}
              item={currentItem as ExerciseItem & { type: 'FLASHCARDS' }}
              onAnswer={handleAnswer}
              isLast={currentIndex + 1 >= items.length}
            />
          )}
          {exerciseType === 'FILL_IN_BLANK' && (
            <FillInBlankExercise
              key={currentItem.id}
              item={currentItem as ExerciseItem & { type: 'FILL_IN_BLANK' }}
              onAnswer={handleAnswer}
              isLast={currentIndex + 1 >= items.length}
            />
          )}
        </Box>
      </Box>

      {rulesHtml && (
        <ExerciseRulesDialog
          open={rulesOpen}
          onClose={() => setRulesOpen(false)}
          rulesHtml={rulesHtml}
        />
      )}

      {/* Stop confirmation dialog */}
      <Dialog open={stopOpen} onClose={() => setStopOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('exercises.session.stopTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('exercises.session.stopMessage')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={() => navigate(-1)}>
            {t('exercises.session.stopConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
