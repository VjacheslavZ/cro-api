/**
 * @module LearnWordsSessionPage
 * @description Step 3 of the Learn Words flow. Runs 4 sequential exercise steps for the
 * selected words: letter-pick → word-to-translate → translate-to-word → matching.
 * Each step creates its own DictionaryPracticeSession and submits answers before advancing.
 * Steps advance automatically with no inter-step screen. On the final step, dispatches
 * fetchMe() and navigates to LearnWordsResultsPage.
 * IMPORTANT: fetchMe() is called only on the final step — calling it mid-session sets
 * auth.loading = true, which causes AuthGuard to unmount this component and lose all state.
 * Uses isStartingRef to prevent duplicate session starts in React 18 StrictMode.
 * @usedBy AppRouter (/exercises/vocabulary/learn/session)
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  LinearProgress,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import type {
  DictionaryPracticeItem,
  DictionaryWord,
  FinishDictionaryPracticeResponse,
  VocabularyExerciseType,
} from '@cro/shared';

import { useAppDispatch } from '../../../store';
import { fetchMe } from '../../../api/auth';
import { useStartDictionaryPractice, useFinishDictionaryPractice } from '../../../api/dictionary';
import { TextInputExercise } from '../TextInputExercise/TextInputExercise';
import { LetterPickExercise } from '../LetterPickExercise/LetterPickExercise';
import { MatchingExercise } from '../MatchingExercise/MatchingExercise';

const EXERCISE_ORDER: VocabularyExerciseType[] = [
  'letter-pick',
  'word-to-translate',
  'translate-to-word',
  'matching',
];

interface LocationState {
  words: DictionaryWord[];
  collectionId?: string;
}

type Answer = { wordId: string; givenAnswer: string; isCorrect: boolean };

type Phase = 'loading' | 'exercising';

/**
 * Orchestrates the 4-step Learn Words session with loading and exercising phases.
 * Steps advance automatically — no inter-step screen.
 * Redirects to setup if location state is missing or word list is empty.
 */
export function LearnWordsSessionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const state = (location.state as LocationState) ?? null;

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<DictionaryPracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepAnswers, setStepAnswers] = useState<Answer[]>([]);
  const [allResults, setAllResults] = useState<FinishDictionaryPracticeResponse[]>([]);

  const startSession = useStartDictionaryPractice();
  const finishSession = useFinishDictionaryPractice();

  const wordIds = state?.words.map((w) => w.id) ?? [];
  const exerciseType = EXERCISE_ORDER[step];

  // Guard against concurrent calls (React 18 StrictMode double-effect + rapid double-clicks)
  const isStartingRef = useRef(false);

  // Helper: start a session for a specific step index
  const startStepSession = useCallback(
    async (stepIndex: number) => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;
      setPhase('loading');
      try {
        const result = await startSession.mutateAsync({
          wordIds,
          exerciseType: EXERCISE_ORDER[stepIndex],
        });
        setSessionId(result.sessionId);
        setItems(result.items);
        setCurrentIndex(0);
        setStepAnswers([]);
        setPhase('exercising');
      } catch {
        // Error handled by startSession.isError
      } finally {
        isStartingRef.current = false;
      }
    },
    // wordIds is stable (derived from location state which never changes)
    [startSession],
  );

  // Start the first session on mount
  useEffect(() => {
    if (wordIds.length === 0) return;
    void startStepSession(0);
  }, []);

  const handleStepComplete = useCallback(
    async (answers: Answer[]) => {
      if (!sessionId) return;
      try {
        const result = await finishSession.mutateAsync({
          sessionId,
          answers,
          exerciseType,
        });

        const updated = [...allResults, result];
        setAllResults(updated);

        if (step === EXERCISE_ORDER.length - 1) {
          // Refresh user XP/streak only on the final step, just before navigating away.
          // Calling fetchMe() on intermediate steps sets auth.loading = true, which causes
          // AuthGuard to unmount this component and lose all exercise state.
          dispatch(fetchMe());
          navigate('/exercises/vocabulary/learn/results', {
            state: { allResults: updated, collectionId: state?.collectionId },
            replace: true,
          });
        } else {
          const nextStep = step + 1;
          setStep(nextStep);
          void startStepSession(nextStep);
        }
      } catch {
        // Error handled by mutation state
      }
    },
    [sessionId, exerciseType, step, allResults, finishSession, dispatch, navigate, state],
  );

  const handleAnswer = useCallback(
    (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => {
      const a: Answer = {
        wordId: answer.itemId,
        givenAnswer: answer.givenAnswer,
        isCorrect: answer.isCorrect,
      };
      const updated = [...stepAnswers, a];
      setStepAnswers(updated);

      if (currentIndex + 1 >= items.length) {
        handleStepComplete(updated);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [stepAnswers, currentIndex, items.length, handleStepComplete],
  );

  if (!state || wordIds.length === 0) {
    navigate('/exercises/vocabulary/learn', { replace: true });
    return null;
  }

  // Step indicator chips
  const stepIndicator = (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      {EXERCISE_ORDER.map((_, i) => (
        <Chip
          key={i}
          label={i + 1}
          size="small"
          color={i < step ? 'success' : i === step ? 'primary' : 'default'}
          variant={i === step ? 'filled' : 'outlined'}
        />
      ))}
    </Box>
  );

  if (phase === 'loading') {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Container>
    );
  }

  // Matching — bulk completion
  if (exerciseType === 'matching') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {stepIndicator}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('exercises.learnWords.exerciseStep', { step: step + 1 })}
        </Typography>
        {(startSession.isError || finishSession.isError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('common.error')}
          </Alert>
        )}
        <MatchingExercise
          items={items}
          onComplete={(answers) =>
            handleStepComplete(
              answers.map((a) => ({
                wordId: a.wordId,
                givenAnswer: a.givenAnswer,
                isCorrect: a.isCorrect,
              })),
            )
          }
        />
      </Container>
    );
  }

  // Sequential exercises (letter-pick, word-to-translate, translate-to-word)
  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;
  const reverseDirection = exerciseType === 'translate-to-word';

  const prompt = reverseDirection ? currentItem.translation : currentItem.wordHr;
  const correctAnswer = reverseDirection ? currentItem.wordHr : currentItem.translation;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {stepIndicator}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('exercises.learnWords.exerciseStep', { step: step + 1 })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('exercises.session.progress', { current: currentIndex + 1, total: items.length })}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 3, height: 8, borderRadius: 4 }}
      />

      {(startSession.isError || finishSession.isError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('common.error')}
        </Alert>
      )}

      {exerciseType === 'letter-pick' && (
        <LetterPickExercise
          key={currentItem.wordId}
          itemId={currentItem.wordId}
          wordHr={currentItem.wordHr}
          translation={currentItem.translation}
          wordToSpeak={currentItem.wordHr}
          onAnswer={handleAnswer}
        />
      )}

      {exerciseType !== 'letter-pick' && (
        <TextInputExercise
          key={currentItem.wordId}
          itemId={currentItem.wordId}
          correctAnswer={correctAnswer}
          placeholder={
            reverseDirection
              ? t('dictionary.practice.translatePlaceholder')
              : t('dictionary.practice.placeholder')
          }
          wordToSpeak={currentItem.wordHr}
          prompt={
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {reverseDirection
                  ? t('dictionary.practice.translateInstruction')
                  : t('dictionary.practice.instruction')}
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {prompt}
              </Typography>
            </Box>
          }
          correctMessage={t('dictionary.practice.correct')}
          incorrectMessage={t('dictionary.practice.incorrect', { answer: correctAnswer })}
          onAnswer={handleAnswer}
        />
      )}
    </Container>
  );
}
