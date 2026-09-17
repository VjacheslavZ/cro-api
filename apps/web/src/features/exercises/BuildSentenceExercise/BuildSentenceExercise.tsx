/**
 * @module BuildSentenceExercise
 * @description Build-a-sentence exercise. The user taps one word at a time from 6 shuffled
 * options to construct the Croatian translation. After the last word is chosen:
 * - All correct → green banner + auto-speech + auto-advance after 1.5s.
 * - Any errors → each wrong slot shows the selected word crossed out with the correct word
 *   above it; auto-speech of the correct sentence; user presses Try Again to retry from scratch.
 * @usedBy SessionPage
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BuildSentenceItem } from '@cro/shared';

import { getTranslation } from '../../../shared/lib/content-utils.ts';
import { useAppSelector } from '../../../store';
import { useSpeech } from '../../../shared/hooks/useSpeech.ts';
import { WordProgressRow } from './WordProgressRow';
import { WordOptions } from './WordOptions';
import { ResultBanner } from './ResultBanner';

interface BuildSentenceExerciseProps {
  item: BuildSentenceItem;
  onAnswer: (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => void;
}

type Phase = 'selecting' | 'correct' | 'incorrect';

const AUTO_ADVANCE_DELAY = 1500;

export function BuildSentenceExercise({ item, onAnswer }: BuildSentenceExerciseProps) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const user = useAppSelector((state) => state.auth.user);

  const sortedWords = useMemo(
    () => [...item.words].sort((a, b) => a.position - b.position),
    [item.words],
  );
  const correctSentence = sortedWords.map((w) => w.wordHr).join(' ');

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('selecting');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleOptionClick = (option: string) => {
    if (phase !== 'selecting') return;

    const newSelected = [...selectedWords, option];
    setSelectedWords(newSelected);

    if (newSelected.length < sortedWords.length) return;

    const isCorrect = newSelected.every((w, i) => w === sortedWords[i].wordHr);
    const givenAnswer = newSelected.join(' ');
    speak(correctSentence);

    if (isCorrect) {
      setPhase('correct');
      timerRef.current = setTimeout(() => {
        onAnswer({ itemId: item.id, givenAnswer, isCorrect: true });
      }, AUTO_ADVANCE_DELAY);
    } else {
      setPhase('incorrect');
    }
  };

  const handleUndo = () => {
    if (phase !== 'selecting') return;
    setSelectedWords((prev) => prev.slice(0, -1));
  };

  const handleRetry = () => {
    setSelectedWords([]);
    setPhase('selecting');
  };

  const currentWordIndex = selectedWords.length;
  const translation = getTranslation(item, user?.nativeLanguage ?? null);

  return (
    <div className="rounded-xl bg-card p-6 shadow-md ring-1 ring-foreground/10">
      <p className="mb-1 text-sm text-muted-foreground">
        {t('exercises.buildSentence.instruction')}
      </p>
      <p className="mb-6 text-lg font-medium">{translation}</p>

      <WordProgressRow
        phase={phase}
        selectedWords={selectedWords}
        sortedWords={sortedWords}
        onUndo={handleUndo}
      />

      {phase === 'selecting' && currentWordIndex < sortedWords.length && (
        <WordOptions
          currentWordIndex={currentWordIndex}
          totalWords={sortedWords.length}
          options={sortedWords[currentWordIndex].options}
          onOptionClick={handleOptionClick}
        />
      )}

      {phase !== 'selecting' && (
        <ResultBanner phase={phase} correctSentence={correctSentence} onRetry={handleRetry} />
      )}
    </div>
  );
}
