/**
 * @module BuildSentenceExercise
 * @description Build-a-sentence exercise. The user taps one word at a time from 6 shuffled
 * options to construct the Croatian translation. After the last word is chosen:
 * - All correct → green banner + auto-speech + auto-advance after 1.5s.
 * - Any errors → each wrong slot shows the selected word crossed out with the correct word
 *   above it; auto-speech of the correct sentence; user presses Next to advance.
 * @usedBy SessionPage
 */
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Typography } from '@mui/material';
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
  isLast: boolean;
}

type Phase = 'selecting' | 'correct' | 'incorrect';

const AUTO_ADVANCE_DELAY = 1500;

export function BuildSentenceExercise({ item, onAnswer, isLast }: BuildSentenceExerciseProps) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const user = useAppSelector((state) => state.auth.user);

  const sortedWords = [...item.words].sort((a, b) => a.position - b.position);
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

  const handleNext = () => {
    onAnswer({ itemId: item.id, givenAnswer: selectedWords.join(' '), isCorrect: false });
  };

  const currentWordIndex = selectedWords.length;
  const translation = getTranslation(item, user?.nativeLanguage ?? null);

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {t('exercises.buildSentence.instruction')}
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
          {translation}
        </Typography>

        <WordProgressRow phase={phase} selectedWords={selectedWords} sortedWords={sortedWords} />

        {phase === 'selecting' && currentWordIndex < sortedWords.length && (
          <WordOptions
            currentWordIndex={currentWordIndex}
            totalWords={sortedWords.length}
            options={sortedWords[currentWordIndex].options}
            onOptionClick={handleOptionClick}
          />
        )}

        {phase !== 'selecting' && (
          <ResultBanner
            phase={phase}
            correctSentence={correctSentence}
            isLast={isLast}
            onNext={handleNext}
          />
        )}
      </CardContent>
    </Card>
  );
}
