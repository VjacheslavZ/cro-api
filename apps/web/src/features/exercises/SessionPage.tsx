import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography, LinearProgress, Box, Alert, Button } from '@mui/material';
import { MenuBook } from '@mui/icons-material';
import type { ExerciseItem } from '@cro/shared';

import { useAppDispatch } from '../../store';
import { useFinishSession } from '../../api/exercises';
import { fetchMe } from '../../api/auth';
import { TypeTheAnswerExercise } from './TypeTheAnswerExercise';
import { FlashcardExercise } from './FlashcardExercise';
import { FillInBlankExercise } from './FillInBlankExercise';
import { ExerciseRulesDialog } from './ExerciseRulesDialog';

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
  const progress = ((currentIndex + 1) / items.length) * 100;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('exercises.session.progress', {
            current: currentIndex + 1,
            total: items.length,
          })}
        </Typography>
        {rulesHtml && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<MenuBook />}
            onClick={() => setRulesOpen(true)}
          >
            {t('exercises.rules.show')}
          </Button>
        )}
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 3, height: 8, borderRadius: 4 }}
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

      {rulesHtml && (
        <ExerciseRulesDialog
          open={rulesOpen}
          onClose={() => setRulesOpen(false)}
          rulesHtml={rulesHtml}
        />
      )}
    </Container>
  );
}
