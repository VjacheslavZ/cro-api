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
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { Timer } from '@mui/icons-material';
import type { DictionaryPracticeItem, SpeedQuizOutcome } from '@cro/shared';

import { useAppDispatch } from '../../../store';
import { fetchMe } from '../../../api/auth';
import { useFinishDictionaryPractice } from '../../../api/dictionary';
import { useSpeech } from '../../../shared/hooks/useSpeech';

const QUESTION_SECONDS = 5;
const CORRECT_ADVANCE_MS = 1000;
const WRONG_ADVANCE_MS = 2000;

interface LocationState {
  items: DictionaryPracticeItem[];
  totalQuestions: number;
  sessionId: string;
}

type Phase = 'answering' | 'result';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(current: DictionaryPracticeItem, all: DictionaryPracticeItem[]): string[] {
  const others = all.filter((w) => w.wordId !== current.wordId);
  const distractors = shuffle(others)
    .slice(0, 2)
    .map((w) => w.translation);
  return shuffle([current.translation, ...distractors]);
}

/**
 * Runs a Speed Quiz session for fully-learned vocabulary words.
 * Redirects to /exercises/vocabulary if location state is missing.
 */
export function SpeedQuizPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const finishSession = useFinishDictionaryPractice();
  const { speak } = useSpeech();

  const allItems = state?.items ?? [];
  const sessionId = state?.sessionId ?? '';

  const [queue, setQueue] = useState<DictionaryPracticeItem[]>(() => shuffle(allItems));
  const [retryQueue, setRetryQueue] = useState<DictionaryPracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('answering');
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  // errorMap: wordId → number of errors (0, 1, or 2)
  const errorMapRef = useRef<Map<string, number>>(new Map());
  // outcomes: only words that need progress reset (progressTarget: 0)
  const outcomesRef = useRef<SpeedQuizOutcome[]>([]);
  // all answers for XP calculation
  const answersRef = useRef<{ wordId: string; givenAnswer: string; isCorrect: boolean }[]>([]);

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentItem = queue[currentIndex] ?? null;
  const [options, setOptions] = useState<string[]>(() =>
    currentItem ? buildOptions(currentItem, allItems) : [],
  );

  useEffect(() => {
    if (currentItem) {
      setOptions(buildOptions(currentItem, allItems));
      speak(currentItem.wordHr);
    }
  }, [currentItem?.wordId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    const results = outcomesRef.current;
    const answers = answersRef.current;
    try {
      const result = await finishSession.mutateAsync({
        sessionId,
        answers,
        speedQuizOutcomes: results,
      });
      dispatch(fetchMe());
      navigate(`/dictionary/practice/results/${sessionId}`, {
        state: {
          correctAnswers: result.correctAnswers,
          totalQuestions: result.totalQuestions,
          xpEarned: result.xpEarned,
          currentStreak: result.currentStreak,
          backPath: '/exercises/vocabulary',
        },
        replace: true,
      });
    } catch {
      // Error handled by finishSession.isError
    }
  }, [sessionId, finishSession, dispatch, navigate]);

  const advanceToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
      setPhase('answering');
      setSelectedAnswer(null);
      setTimeLeft(QUESTION_SECONDS);
    } else if (retryQueue.length > 0) {
      // Switch to retry queue
      setQueue(retryQueue);
      setRetryQueue([]);
      setCurrentIndex(0);
      setPhase('answering');
      setSelectedAnswer(null);
      setTimeLeft(QUESTION_SECONDS);
    } else {
      void handleSubmit();
    }
  }, [currentIndex, queue.length, retryQueue, handleSubmit]);

  const handleAnswer = useCallback(
    (answer: string | null) => {
      if (phase !== 'answering' || !currentItem) return;
      if (tickRef.current) clearInterval(tickRef.current);

      const isCorrect = answer === currentItem.translation;
      const picked = answer ?? '';
      setSelectedAnswer(picked);
      setWasCorrect(isCorrect);
      setPhase('result');
      setDoneCount((n) => n + 1);

      answersRef.current.push({
        wordId: currentItem.wordId,
        givenAnswer: picked,
        isCorrect,
      });

      if (!isCorrect) {
        const errors = (errorMapRef.current.get(currentItem.wordId) ?? 0) + 1;
        errorMapRef.current.set(currentItem.wordId, errors);

        if (errors === 1) {
          // First error: add to retry queue
          setRetryQueue((q) => [...q, currentItem]);
        } else {
          // Second error: reset progress to 0
          const alreadyRecorded = outcomesRef.current.some((o) => o.wordId === currentItem.wordId);
          if (!alreadyRecorded) {
            outcomesRef.current.push({ wordId: currentItem.wordId, progressTarget: 0 });
          }
        }
      }

      const delay = isCorrect ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS;
      advanceTimerRef.current = setTimeout(() => advanceToNext(), delay);
    },
    [phase, currentItem, advanceToNext],
  );

  // Countdown timer
  useEffect(() => {
    if (phase !== 'answering') return;
    setTimeLeft(QUESTION_SECONDS);
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(tickRef.current!);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase, currentItem?.wordId]);

  if (!state || allItems.length === 0) {
    navigate('/exercises/vocabulary', { replace: true });
    return null;
  }

  const totalWords = allItems.length;
  const progressPercent = (doneCount / (totalWords + retryQueue.length)) * 100;
  const timerColor =
    timeLeft <= 1
      ? 'error.main'
      : timeLeft <= 2
        ? 'warning.main'
        : timeLeft <= 3
          ? 'warning.light'
          : 'primary.main';

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timer color="warning" />
          <Typography variant="h6">{t('exercises.vocabulary.speedQuiz')}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {t('exercises.speedQuiz.progress', { done: doneCount, total: totalWords })}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progressPercent}
        sx={{ mb: 3, height: 6, borderRadius: 3 }}
      />

      {finishSession.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('common.error')}
        </Alert>
      )}

      {finishSession.isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : currentItem ? (
        <Card variant="outlined">
          <CardContent>
            {/* Timer */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: timerColor }}>
                {phase === 'answering' ? timeLeft : ''}
              </Typography>
            </Box>

            {/* Croatian word */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('exercises.letterPick.instruction')}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {currentItem.wordHr}
              </Typography>
            </Box>

            {/* Result alert */}
            {phase === 'result' && (
              <Alert severity={wasCorrect ? 'success' : 'error'} sx={{ mb: 2 }}>
                {wasCorrect
                  ? t('exercises.speedQuiz.correct')
                  : selectedAnswer === null
                    ? `${t('exercises.speedQuiz.timeUp')} ${t('exercises.speedQuiz.wrongAnswer', { answer: currentItem.translation })}`
                    : t('exercises.speedQuiz.wrongAnswer', { answer: currentItem.translation })}
              </Alert>
            )}

            {/* Answer options */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {options.map((opt) => {
                const isCorrectOpt = opt === currentItem.translation;
                let color: 'success' | 'error' | 'primary' | 'inherit' = 'primary';
                if (phase === 'result') {
                  if (isCorrectOpt) color = 'success';
                  else if (opt === selectedAnswer) color = 'error';
                  else color = 'inherit';
                }
                return (
                  <Button
                    key={opt}
                    fullWidth
                    variant={phase === 'result' && isCorrectOpt ? 'contained' : 'outlined'}
                    color={color}
                    disabled={phase === 'result'}
                    onClick={() => handleAnswer(opt)}
                    sx={{ py: 1.5, justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    {opt}
                  </Button>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      ) : null}
    </Container>
  );
}
