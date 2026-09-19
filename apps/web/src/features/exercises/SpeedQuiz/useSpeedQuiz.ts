import { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DictionaryPracticeItem, SpeedQuizOutcome } from '@cro/shared';

import { useAppDispatch } from '@/store';
import { fetchMe } from '@/api/auth.ts';
import { useFinishDictionaryPractice } from '@/api/dictionary.ts';
import { useSpeech } from '@/shared/hooks/useSpeech.ts';

export type Phase = 'answering' | 'result';

export const QUESTION_SECONDS = 5;
const CORRECT_ADVANCE_MS = 1000;
const WRONG_ADVANCE_MS = 2000;

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

export function useSpeedQuiz(allItems: DictionaryPracticeItem[], sessionId: string) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const finishSession = useFinishDictionaryPractice();
  const { speak } = useSpeech();

  const [queue, setQueue] = useState<DictionaryPracticeItem[]>(() => shuffle(allItems));
  const [retryQueue, setRetryQueue] = useState<DictionaryPracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('answering');
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const [stopOpen, setStopOpen] = useState(false);

  const errorMapRef = useRef<Map<string, number>>(new Map());
  const outcomesRef = useRef<SpeedQuizOutcome[]>([]);
  const answersRef = useRef<{ wordId: string; givenAnswer: string; isCorrect: boolean }[]>([]);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentItem = queue[currentIndex] ?? null;
  const [options, setOptions] = useState<string[]>(() =>
    currentItem ? buildOptions(currentItem, allItems) : [],
  );

  // Speak the first question once on mount; later questions are spoken in advanceToNext.
  const speakFirstQuestion = useEffectEvent(() => {
    if (currentItem) speak(currentItem.wordHr);
  });
  useEffect(() => {
    speakFirstQuestion();
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const result = await finishSession.mutateAsync({
        sessionId,
        answers: answersRef.current,
        speedQuizOutcomes: outcomesRef.current,
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
    let nextItem: DictionaryPracticeItem;
    if (nextIndex < queue.length) {
      nextItem = queue[nextIndex];
      setCurrentIndex(nextIndex);
    } else if (retryQueue.length > 0) {
      nextItem = retryQueue[0];
      setQueue(retryQueue);
      setRetryQueue([]);
      setCurrentIndex(0);
    } else {
      void handleSubmit();
      return;
    }
    setOptions(buildOptions(nextItem, allItems));
    setPhase('answering');
    setSelectedAnswer(null);
    setTimeLeft(QUESTION_SECONDS);
    speak(nextItem.wordHr);
  }, [currentIndex, queue, retryQueue, allItems, speak, handleSubmit]);

  const handleAnswer = useCallback(
    (answer: string | null) => {
      if (phase !== 'answering' || !currentItem) return;

      const isCorrect = answer === currentItem.translation;
      const picked = answer ?? '';
      setSelectedAnswer(picked);
      setPhase('result');
      setDoneCount((n) => n + 1);

      answersRef.current.push({ wordId: currentItem.wordId, givenAnswer: picked, isCorrect });

      if (!isCorrect) {
        const errors = (errorMapRef.current.get(currentItem.wordId) ?? 0) + 1;
        errorMapRef.current.set(currentItem.wordId, errors);
        if (errors === 1) {
          setRetryQueue((q) => [...q, currentItem]);
        } else {
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

  // Time is up — counts as a wrong answer. An effect event so the countdown below always
  // calls the latest handleAnswer without restarting the timer on every render.
  const onTimeUp = useEffectEvent(() => handleAnswer(null));

  // Countdown: one tick per second while answering, paused while the stop dialog is open.
  // Leaving the 'answering' phase clears the pending tick via the effect cleanup.
  useEffect(() => {
    if (phase !== 'answering' || stopOpen) return;
    const tick = setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        onTimeUp();
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => clearTimeout(tick);
  }, [phase, stopOpen, timeLeft]);

  const totalWords = allItems.length;
  const progressPercent = (doneCount / (totalWords + retryQueue.length)) * 100;
  /** Tailwind text-colour class for the countdown, from calm blue to alarming red. */
  const timerClassName =
    timeLeft <= 1
      ? 'text-destructive'
      : timeLeft <= 2
        ? 'text-warning'
        : timeLeft <= 3
          ? 'text-warning/70'
          : 'text-primary';

  return {
    currentItem,
    options,
    phase,
    timeLeft,
    timerClassName,
    selectedAnswer,
    doneCount,
    totalWords,
    progressPercent,
    stopOpen,
    setStopOpen,
    handleAnswer,
    isError: finishSession.isError,
    isPending: finishSession.isPending,
  };
}
