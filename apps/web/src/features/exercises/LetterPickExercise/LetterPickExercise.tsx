import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography, Paper, Alert, Card, CardContent } from '@mui/material';
import { LightbulbOutlined } from '@mui/icons-material';

import { type PoolLetter, buildPool } from './helpers';

interface LetterPickExerciseProps {
  itemId: string;
  wordHr: string;
  translation: string;
  onAnswer: (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => void;
}

export function LetterPickExercise({
  itemId,
  wordHr,
  translation,
  onAnswer,
}: LetterPickExerciseProps) {
  const { t } = useTranslation();
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleNext = () => {
    onAnswer({ itemId, givenAnswer: wordHr, isCorrect: !hasError });
  };

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Prompt */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('exercises.letterPick.instruction')}
          </Typography>
          <Typography variant="h5" sx={{ mt: 1 }}>
            {translation}
          </Typography>
        </Box>

        {/* Answer row */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {wordHr.split('').map((char, idx) => (
            <Paper
              key={idx}
              variant="outlined"
              sx={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: placed[idx] !== undefined ? 'success.light' : 'background.paper',
                borderColor: placed[idx] !== undefined ? 'success.main' : 'divider',
              }}
            >
              <Typography variant="h6" sx={{ lineHeight: 1, userSelect: 'none' }}>
                {placed[idx] !== undefined ? char : ''}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Letter pool — positions stay fixed, used letters become invisible spacers */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {pool.map((letter) =>
            letter.used ? (
              <Box key={letter.id} sx={{ minWidth: 44, height: 44 }} />
            ) : (
              <Button
                key={letter.id}
                variant="outlined"
                onClick={() => processLetter(letter)}
                disabled={isComplete}
                sx={{
                  minWidth: 44,
                  height: 44,
                  px: 1,
                  color: flashErrorId === letter.id ? 'error.main' : undefined,
                  borderColor: flashErrorId === letter.id ? 'error.main' : undefined,
                  transition: 'color 0.1s, border-color 0.1s',
                }}
              >
                {letter.char.toUpperCase()}
              </Button>
            ),
          )}
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1, mr: 2 }}>
            {isComplete && (
              <Alert severity={hasError ? 'warning' : 'success'}>
                {hasError
                  ? t('exercises.letterPick.withErrors')
                  : t('exercises.letterPick.perfect')}
              </Alert>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {!isComplete && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<LightbulbOutlined />}
                onClick={handleHint}
              >
                {t('exercises.letterPick.hint')}
              </Button>
            )}
            {isComplete && (
              <Button variant="contained" onClick={handleNext}>
                {t('exercises.session.next')}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
