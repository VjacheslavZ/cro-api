import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography, LinearProgress, Box, Alert } from '@mui/material';
import type { DictionaryPracticeItem } from '@cro/shared';

import { useAppDispatch } from '../../store';
import { useFinishDictionaryPractice } from '../../api/dictionary';
import { fetchMe } from '../../api/auth';
import { TextInputExercise } from '../exercises/TextInputExercise';

interface PracticeLocationState {
  items: DictionaryPracticeItem[];
  totalQuestions: number;
}

interface PracticeAnswer {
  wordId: string;
  givenAnswer: string;
  isCorrect: boolean;
}

export function DictionaryPracticePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const state = location.state as PracticeLocationState | null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PracticeAnswer[]>([]);
  const finishPractice = useFinishDictionaryPractice();

  const handleAnswer = useCallback(
    async (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => {
      const practiceAnswer: PracticeAnswer = {
        wordId: answer.itemId,
        givenAnswer: answer.givenAnswer,
        isCorrect: answer.isCorrect,
      };
      const updatedAnswers = [...answers, practiceAnswer];
      setAnswers(updatedAnswers);

      if (!state) return;

      if (currentIndex + 1 >= state.items.length) {
        try {
          const result = await finishPractice.mutateAsync({
            sessionId: sessionId!,
            answers: updatedAnswers,
          });
          dispatch(fetchMe());
          navigate(`/dictionary/practice/results/${sessionId}`, {
            state: {
              correctAnswers: result.correctAnswers,
              totalQuestions: result.totalQuestions,
              xpEarned: result.xpEarned,
              currentStreak: result.currentStreak,
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
    [answers, currentIndex, state, sessionId, finishPractice, dispatch, navigate],
  );

  if (!state || !state.items || state.items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Container>
    );
  }

  const { items } = state;
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
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 3, height: 8, borderRadius: 4 }}
      />

      {finishPractice.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('common.error')}
        </Alert>
      )}

      <TextInputExercise
        key={currentItem.wordId}
        itemId={currentItem.wordId}
        correctAnswer={currentItem.translation}
        placeholder={t('dictionary.practice.placeholder')}
        prompt={
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('dictionary.practice.instruction')}
            </Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>
              {currentItem.wordHr}
            </Typography>
          </Box>
        }
        correctMessage={t('dictionary.practice.correct')}
        incorrectMessage={t('dictionary.practice.incorrect', {
          answer: currentItem.translation,
        })}
        onAnswer={handleAnswer}
      />
    </Container>
  );
}
