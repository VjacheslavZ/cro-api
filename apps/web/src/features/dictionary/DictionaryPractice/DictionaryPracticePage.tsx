import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Stop } from '@mui/icons-material';
import type { DictionaryPracticeItem } from '@cro/shared';

import { useAppDispatch } from '../../../store';
import { useFinishDictionaryPractice } from '../../../api/dictionary.ts';
import { fetchMe } from '../../../api/auth.ts';
import { TextInputExercise } from '../../exercises/TextInputExercise/TextInputExercise.tsx';
import { LetterPickExercise } from '../../exercises/LetterPickExercise/LetterPickExercise.tsx';
import { MatchingExercise } from '../../exercises/MatchingExercise/MatchingExercise.tsx';

/**
 * Route: /dictionary/practice/:sessionId
 *
 * Active dictionary practice session page. Renders one exercise item at a
 * time, advancing through the item list received via `location.state`. On the
 * last item it calls `finishPractice`, awards XP/streak, and navigates to
 * DictionaryPracticeResultsPage.
 *
 * Supports four exercise directions via `state.direction`:
 * - `word-to-translate` — show Croatian word, type translation
 * - `translate-to-word` — show translation, type Croatian word
 * - `letter-pick` — assemble the Croatian word from shuffled letters
 * - `matching` — match all pairs at once (MatchingExercise, bulk completion)
 *
 * A "Stop" button opens a confirmation dialog before abandoning the session.
 *
 * Reached from: MyDictionaryPage practice start flow.
 */

interface PracticeLocationState {
  items: DictionaryPracticeItem[];
  totalQuestions: number;
  direction?: 'word-to-translate' | 'translate-to-word' | 'letter-pick' | 'matching';
  backPath?: string;
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
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
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
              backPath: state?.backPath,
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

  const handleBulkComplete = useCallback(
    async (bulkAnswers: PracticeAnswer[]) => {
      if (!state) return;
      try {
        const result = await finishPractice.mutateAsync({
          sessionId: sessionId!,
          answers: bulkAnswers,
        });
        dispatch(fetchMe());
        navigate(`/dictionary/practice/results/${sessionId}`, {
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
    },
    [state, sessionId, finishPractice, dispatch, navigate],
  );

  if (!state || !state.items || state.items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Container>
    );
  }

  const { items, direction } = state;

  if (direction === 'matching') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            size="small"
            color="inherit"
            startIcon={<Stop />}
            onClick={() => setStopDialogOpen(true)}
          >
            {t('exercises.session.stop')}
          </Button>
        </Box>

        {finishPractice.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('common.error')}
          </Alert>
        )}

        <MatchingExercise items={items} onComplete={handleBulkComplete} />

        <Dialog open={stopDialogOpen} onClose={() => setStopDialogOpen(false)}>
          <DialogTitle>{t('exercises.session.stopTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText>{t('exercises.session.stopMessage')}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStopDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              color="error"
              onClick={() => navigate(state.backPath ?? '/exercises/vocabulary')}
            >
              {t('exercises.session.stopConfirm')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  const reverseDirection = direction === 'translate-to-word';
  const currentItem = items[currentIndex];

  const prompt = reverseDirection ? currentItem.translation : currentItem.wordHr;
  const correctAnswer = reverseDirection ? currentItem.wordHr : currentItem.translation;
  const instruction = reverseDirection
    ? t('dictionary.practice.translateInstruction')
    : t('dictionary.practice.instruction');
  const placeholder = reverseDirection
    ? t('dictionary.practice.translatePlaceholder')
    : t('dictionary.practice.placeholder');

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {finishPractice.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('common.error')}
        </Alert>
      )}

      {direction === 'letter-pick' && (
        <LetterPickExercise
          key={currentItem.wordId}
          itemId={currentItem.wordId}
          wordHr={currentItem.wordHr}
          translation={currentItem.translation}
          wordToSpeak={currentItem.wordHr}
          onAnswer={handleAnswer}
        />
      )}

      {direction !== 'letter-pick' && (
        <TextInputExercise
          key={currentItem.wordId}
          itemId={currentItem.wordId}
          correctAnswer={correctAnswer}
          placeholder={placeholder}
          wordToSpeak={currentItem.wordHr}
          progress={{ currentIndex, total: items.length, onStop: () => setStopDialogOpen(true) }}
          prompt={
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {instruction}
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {prompt}
              </Typography>
            </Box>
          }
          correctMessage={t('dictionary.practice.correct')}
          incorrectMessage={t('dictionary.practice.incorrect', {
            answer: correctAnswer,
          })}
          onAnswer={handleAnswer}
        />
      )}

      <Dialog open={stopDialogOpen} onClose={() => setStopDialogOpen(false)}>
        <DialogTitle>{t('exercises.session.stopTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('exercises.session.stopMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            color="error"
            onClick={() => navigate(state?.backPath ?? '/exercises/vocabulary')}
          >
            {t('exercises.session.stopConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
