import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { VolumeUp, CheckCircle } from '@mui/icons-material';
import type { DictionaryPracticeItem } from '@cro/shared';

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

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('exercises.matching.progress', { matched: matched.size, total: items.length })}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Left column — speaker icons */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item) => {
            const isMatched = matched.has(item.wordId);
            const isSelected = selectedWordId === item.wordId;
            return (
              <Paper
                key={item.wordId}
                variant="outlined"
                onClick={() => handleWordClick(item.wordId, item.wordHr)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  cursor: isMatched ? 'default' : 'pointer',
                  bgcolor: isMatched
                    ? 'success.light'
                    : isSelected
                      ? 'primary.light'
                      : 'background.paper',
                  borderColor: isMatched ? 'success.main' : isSelected ? 'primary.main' : 'divider',
                  borderWidth: isSelected ? 2 : 1,
                  transition: 'background-color 0.15s, border-color 0.15s',
                  '&:hover': {
                    bgcolor: isMatched
                      ? 'success.light'
                      : isSelected
                        ? 'primary.light'
                        : 'action.hover',
                  },
                }}
              >
                {isMatched ? (
                  <CheckCircle color="success" fontSize="small" sx={{ flexShrink: 0 }} />
                ) : (
                  <VolumeUp
                    fontSize="small"
                    sx={{ flexShrink: 0, color: isSelected ? 'primary.main' : 'action.active' }}
                  />
                )}
                <Typography
                  variant="body1"
                  color={isMatched ? 'success.dark' : isSelected ? 'primary.main' : 'text.primary'}
                  noWrap
                >
                  {isMatched ? item.wordHr : '*************'}
                </Typography>
              </Paper>
            );
          })}
        </Box>

        {/* Right column — shuffled translations */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {shuffledTranslations.map((option) => {
            const isMatched = matched.has(option.wordId);
            const isFlashWrong = flashWrongId === option.wordId;
            return (
              <Paper
                key={option.wordId}
                variant="outlined"
                onClick={() => handleTranslationClick(option)}
                sx={{
                  px: 2,
                  py: 1.5,
                  cursor: isMatched ? 'default' : 'pointer',
                  bgcolor: isMatched
                    ? 'success.light'
                    : isFlashWrong
                      ? 'error.light'
                      : 'background.paper',
                  borderColor: isMatched ? 'success.main' : isFlashWrong ? 'error.main' : 'divider',
                  transition: 'background-color 0.1s, border-color 0.1s',
                  '&:hover': {
                    bgcolor: isMatched
                      ? 'success.light'
                      : isFlashWrong
                        ? 'error.light'
                        : selectedWordId
                          ? 'action.hover'
                          : 'background.paper',
                  },
                }}
              >
                <Typography
                  variant="body1"
                  color={isMatched ? 'success.dark' : isFlashWrong ? 'error.main' : 'text.primary'}
                  noWrap
                >
                  {option.translation}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {isComplete && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {t('exercises.matching.complete')}
        </Alert>
      )}
    </Box>
  );
}
