/**
 * @module MatchingExercise
 * @description Matching exercise: two-column layout where the user pairs Croatian words
 * (left, hidden until matched) with shuffled translations (right). Click a word then a
 * translation to attempt a match. Wrong selections flash red; the word gains an error flag.
 * isCorrect per word = matched on the first try with no errors.
 * Speaks each Croatian word when selected. Calls onComplete once all pairs are matched.
 * @usedBy LearnWordsSessionPage
 */
import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictionaryPracticeItem } from '@cro/shared';
import { CircleCheckIcon, Volume2Icon } from 'lucide-react';
import { cn } from 'cn';

import { Alert, AlertTitle } from '@/components/ui/alert';

import { speakWord } from '../../../shared/lib/speech.ts';

interface TranslationOption {
  wordId: string;
  translation: string;
}

interface MatchingExerciseProps {
  items: DictionaryPracticeItem[];
  onComplete: (answers: { wordId: string; givenAnswer: string; isCorrect: boolean }[]) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Renders the full matching board for a set of vocabulary items.
 * @param props.items - Word-translation pairs to match; translations are shuffled once on mount
 * @param props.onComplete - Called with all answers once every pair is matched;
 *   each answer has `{ wordId, givenAnswer: translation, isCorrect: matchedWithoutErrors }`
 */
export function MatchingExercise({ items, onComplete }: MatchingExerciseProps) {
  const { t } = useTranslation();
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shuffledTranslations = useMemo<TranslationOption[]>(
    () => shuffle(items.map((item) => ({ wordId: item.wordId, translation: item.translation }))),
    [],
  );

  // wordId -> whether it was matched without errors
  const [matched, setMatched] = useState<Map<string, boolean>>(new Map());
  // wordIds that had at least one wrong attempt
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [flashWrongId, setFlashWrongId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleWordClick = (wordId: string, wordHr: string) => {
    speakWord(wordHr);
    if (matched.has(wordId)) return;
    setSelectedWordId(wordId);
  };

  const handleTranslationClick = (option: TranslationOption) => {
    if (!selectedWordId || matched.has(option.wordId)) return;

    if (option.wordId === selectedWordId) {
      const hadErrors = errors.has(selectedWordId);
      const newMatched = new Map(matched);
      newMatched.set(selectedWordId, !hadErrors);
      setMatched(newMatched);
      setSelectedWordId(null);

      if (newMatched.size === items.length) {
        setIsComplete(true);
        onComplete(
          items.map((item) => ({
            wordId: item.wordId,
            givenAnswer: item.translation,
            isCorrect: newMatched.get(item.wordId) ?? false,
          })),
        );
      }
    } else {
      setErrors((prev) => new Set(prev).add(selectedWordId));
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setFlashWrongId(option.wordId);
      flashTimerRef.current = setTimeout(() => setFlashWrongId(null), 500);
    }
  };

  const tileClass =
    'flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default';

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {t('exercises.matching.progress', { matched: matched.size, total: items.length })}
      </p>

      <div className="flex gap-4">
        {/* Left column — speaker icons */}
        <div className="flex flex-1 flex-col gap-2">
          {items.map((item) => {
            const isMatched = matched.has(item.wordId);
            const isSelected = selectedWordId === item.wordId;
            return (
              <button
                key={item.wordId}
                type="button"
                onClick={() => handleWordClick(item.wordId, item.wordHr)}
                aria-pressed={isSelected}
                className={cn(
                  tileClass,
                  isMatched
                    ? 'border-green-500 bg-green-100 text-green-900'
                    : isSelected
                      ? 'border-2 border-primary bg-green-50 text-primary'
                      : 'hover:bg-green-50',
                )}
              >
                {isMatched ? (
                  <CircleCheckIcon className="size-4 shrink-0" />
                ) : (
                  <Volume2Icon
                    className={cn(
                      'size-4 shrink-0',
                      isSelected ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                )}
                <span className="truncate">{isMatched ? item.wordHr : '*************'}</span>
              </button>
            );
          })}
        </div>

        {/* Right column — shuffled translations */}
        <div className="flex flex-1 flex-col gap-2">
          {shuffledTranslations.map((option) => {
            const isMatched = matched.has(option.wordId);
            const isFlashWrong = flashWrongId === option.wordId;
            return (
              <button
                key={option.wordId}
                type="button"
                onClick={() => handleTranslationClick(option)}
                className={cn(
                  tileClass,
                  isMatched
                    ? 'border-green-500 bg-green-100 text-green-900'
                    : isFlashWrong
                      ? 'border-destructive bg-red-100 text-destructive'
                      : selectedWordId && 'hover:bg-muted',
                )}
              >
                <span className="truncate">{option.translation}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isComplete && (
        <Alert className="mt-4 border-green-500 text-green-800">
          <CircleCheckIcon />
          <AlertTitle>{t('exercises.matching.complete')}</AlertTitle>
        </Alert>
      )}
    </div>
  );
}
