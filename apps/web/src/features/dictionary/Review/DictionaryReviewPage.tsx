import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Alert,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Stop } from '@mui/icons-material';
import type { DictionaryReviewItem, FsrsRating } from '@cro/shared';

import { useAppDispatch } from '../../../store';
import { useFinishDictionaryReview } from '../../../api/dictionary.ts';
import { fetchMe } from '../../../api/auth.ts';
import { DictionaryReviewExercise } from '../../exercises/DictionaryReviewExercise/DictionaryReviewExercise.tsx';

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
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Container>
    );
  }

  const { items } = state;
  const currentItem = items[currentIndex];

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={(currentIndex / items.length) * 100}
          sx={{ flex: 1, height: 8, borderRadius: 4 }}
        />
        <Button
          size="small"
          color="inherit"
          startIcon={<Stop />}
          onClick={() => setStopDialogOpen(true)}
        >
          {t('exercises.session.stop')}
        </Button>
      </Box>

      {finishReview.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('common.error')}
        </Alert>
      )}

      <DictionaryReviewExercise
        key={currentItem.wordId}
        item={currentItem}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onAnswer={handleAnswer}
      />

      <Dialog open={stopDialogOpen} onClose={() => setStopDialogOpen(false)}>
        <DialogTitle>{t('exercises.session.stopTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('exercises.session.stopMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button color="error" onClick={() => navigate(state.backPath ?? '/exercises/vocabulary')}>
            {t('exercises.session.stopConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
