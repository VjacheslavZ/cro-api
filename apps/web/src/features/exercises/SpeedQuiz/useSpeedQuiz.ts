import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DictionaryPracticeItem, SpeedQuizOutcome } from '@cro/shared';

import { useAppDispatch } from '../../../store';
import { fetchMe } from '../../../api/auth';
import { useFinishDictionaryPractice } from '../../../api/dictionary';
import { useSpeech } from '../../../shared/hooks/useSpeech';

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

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
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
    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
      setPhase('answering');
      setSelectedAnswer(null);
      setTimeLeft(QUESTION_SECONDS);
    } else if (retryQueue.length > 0) {
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

  // Reset timer on each new question
  useEffect(() => {
    if (phase === 'answering') setTimeLeft(QUESTION_SECONDS);
  }, [phase, currentItem?.wordId]);

  // Countdown interval — paused while stop dialog is open
  useEffect(() => {
    if (phase !== 'answering' || stopOpen) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
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
  }, [phase, currentItem?.wordId, stopOpen]);

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

  return {
    currentItem,
    options,
    phase,
    timeLeft,
    timerColor,
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
