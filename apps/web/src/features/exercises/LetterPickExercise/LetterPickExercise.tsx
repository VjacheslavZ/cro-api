/**
 * @module LetterPickExercise
 * @description Letter-pick exercise: shows a translation and a shuffled pool of letter tiles.
 * User taps or types letters to reconstruct the Croatian word in order.
 * Using a hint counts as an error. Keyboard support: typing a character picks the matching tile.
 * Speaks the word on completion. isCorrect = true only if completed with no errors and no hint.
 * @usedBy LearnWordsSessionPage
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, LightbulbIcon } from 'lucide-react';
import { cn } from 'cn';

import { Button } from '@/components/ui/button';

import { type PoolLetter, buildPool } from './helpers';
import { useSpeech } from '../../../shared/hooks/useSpeech.ts';
import { ExerciseProgressHeader } from '../ExerciseProgressHeader';
import { ExerciseActionButton } from '../ui/ExerciseActionButton';
import { ExerciseCard } from '../ui/ExerciseCard';
import { ExerciseFeedback } from '../ui/ExerciseFeedback';

const CORRECT_DELAY = Number(import.meta.env.VITE_CORRECT_DELAY_MS) || 1000;

interface ProgressProps {
  currentIndex: number;
  total: number;
  onStop: () => void;
}

interface LetterPickExerciseProps {
  itemId: string;
  wordHr: string;
  translation: string;
  wordToSpeak?: string;
  progress?: ProgressProps;
  onAnswer: (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => void;
}

/**
 * Renders the interactive letter-pick exercise for a single vocabulary word.
 * @param props.itemId - Passed through to onAnswer; resets internal state when it changes
 * @param props.wordHr - The correct Croatian word to reconstruct
 * @param props.translation - The user's native-language translation shown as prompt
 * @param props.wordToSpeak - Word spoken on completion; defaults to wordHr if omitted
 * @param props.onAnswer - Called with `{ itemId, givenAnswer: wordHr, isCorrect }` when user clicks Next
 */
export function LetterPickExercise({
  itemId,
  wordHr,
  translation,
  wordToSpeak,
  progress,
  onAnswer,
}: LetterPickExerciseProps) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [placed, setPlaced] = useState<string[]>([]);
  const [pool, setPool] = useState<PoolLetter[]>(() => buildPool(wordHr));
  const [flashErrorId, setFlashErrorId] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setPlaced([]);
    setPool(buildPool(wordHr));
    setFlashErrorId(null);
    setHasError(false);
    setHintUsed(false);
    setIsComplete(false);
  }, [itemId, wordHr]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const processLetter = useCallback(
    (letter: PoolLetter) => {
      if (isComplete || letter.used) return;
      const expectedChar = wordHr.toLowerCase()[placed.length];

      if (letter.char === expectedChar) {
        const newPlaced = [...placed, letter.char];
        setPool((prev) => prev.map((l) => (l.id === letter.id ? { ...l, used: true } : l)));
        setPlaced(newPlaced);
        if (newPlaced.length === wordHr.length) {
          setIsComplete(true);
        }
      } else {
        if (!hasError) setHasError(true);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        setFlashErrorId(letter.id);
        flashTimerRef.current = setTimeout(() => setFlashErrorId(null), 500);
      }
    },
    [isComplete, wordHr, placed, hasError],
  );

  useEffect(() => {
    if (!isComplete) return;
    speak(wordToSpeak ?? wordHr);
    if (!hasError) {
      advanceTimerRef.current = setTimeout(() => {
        onAnswer({ itemId, givenAnswer: wordHr, isCorrect: true });
      }, CORRECT_DELAY);
    }
  }, [isComplete]);

  useEffect(() => {
    if (isComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      const typedChar = e.key.toLowerCase();
      const letter = pool.find((l) => !l.used && l.char === typedChar);
      if (letter) processLetter(letter);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pool, isComplete, processLetter]);

  const handleHint = () => {
    if (isComplete) return;
    const expectedChar = wordHr.toLowerCase()[placed.length];
    const hintLetter = pool.find((l) => !l.used && l.char === expectedChar);
    if (!hintLetter) return;

    if (!hintUsed) {
      setHasError(true);
      setHintUsed(true);
    }

    const newPlaced = [...placed, hintLetter.char];
    setPool((prev) => prev.map((l) => (l.id === hintLetter.id ? { ...l, used: true } : l)));
    setPlaced(newPlaced);
    if (newPlaced.length === wordHr.length) {
      setIsComplete(true);
    }
  };

  const handleReset = () => {
    setPlaced([]);
    setPool(buildPool(wordHr));
  };

  const handleNext = () => {
    onAnswer({ itemId, givenAnswer: wordHr, isCorrect: !hasError });
  };

  const getSlotClass = (idx: number) => {
    if (placed[idx] === undefined) {
      return 'border-neutral-300 bg-neutral-50 text-neutral-400';
    }
    if (!isComplete) {
      return 'border-blue-500 bg-blue-100 text-blue-700';
    }
    if (!hasError) {
      return 'border-green-500 bg-green-100 text-green-700';
    }
    return 'border-yellow-500 bg-yellow-100 text-yellow-700';
  };

  return (
    <>
      {progress && (
        <ExerciseProgressHeader
          currentIndex={progress.currentIndex}
          total={progress.total}
          onStop={progress.onStop}
        />
      )}
      <ExerciseCard status={isComplete ? (hasError ? 'warning' : 'success') : 'idle'}>
        {/* Prompt */}
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            {t('exercises.letterPick.instruction')}
          </p>
          <p className="text-3xl font-bold text-foreground">{translation}</p>
        </div>

        {/* Placed word display */}
        <div className="mb-8 flex min-h-16 flex-wrap justify-center gap-3">
          {wordHr.split('').map((char, idx) => (
            <div
              key={idx}
              className={cn(
                'flex size-13 items-center justify-center rounded-lg border-2 text-lg font-bold transition-all select-none',
                getSlotClass(idx),
              )}
            >
              {placed[idx] !== undefined ? char : '_'}
            </div>
          ))}
        </div>

        {/* Letter pool — positions stay fixed, used letters become invisible spacers */}
        <div className="mb-4 flex flex-wrap justify-center gap-3">
          {pool.map((letter) =>
            letter.used ? (
              <div key={letter.id} className="size-13 shrink-0" />
            ) : (
              <Button
                key={letter.id}
                variant="outline"
                onClick={() => processLetter(letter)}
                disabled={isComplete}
                className={cn(
                  'size-13 rounded-lg border-neutral-300 p-0 text-lg font-bold text-neutral-700 transition-colors hover:border-purple-400 hover:bg-purple-50',
                  flashErrorId === letter.id && 'border-destructive text-destructive',
                )}
              >
                {letter.char.toUpperCase()}
              </Button>
            ),
          )}
        </div>

        {/* Reset button */}
        {placed.length > 0 && !isComplete && (
          <div className="mb-2 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleReset}
            >
              {t('exercises.letterPick.reset')}
            </Button>
          </div>
        )}

        <ExerciseFeedback kind={isComplete ? (hasError ? 'warning' : 'correct') : null}>
          {hasError ? t('exercises.letterPick.withErrors') : t('exercises.letterPick.perfect')}
        </ExerciseFeedback>

        {/* Action area */}
        {!isComplete && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleHint}>
              <LightbulbIcon data-icon="inline-start" />
              {t('exercises.letterPick.hint')}
            </Button>
          </div>
        )}
        {isComplete && hasError && (
          <ExerciseActionButton onClick={handleNext}>
            {t('exercises.session.next')}
            <ArrowRightIcon data-icon="inline-end" />
          </ExerciseActionButton>
        )}
      </ExerciseCard>
    </>
  );
}
