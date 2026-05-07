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
import { Box, Button, Typography, Card, CardContent } from '@mui/material';
import { LightbulbOutlined, CheckCircle, Cancel, ArrowForward } from '@mui/icons-material';

import { type PoolLetter, buildPool } from './helpers';
import { useSpeech } from '../../../shared/hooks/useSpeech.ts';
import { ExerciseProgressHeader } from '../ExerciseProgressHeader';

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

  const getSlotStyle = (idx: number) => {
    if (placed[idx] === undefined) {
      return { bgcolor: 'grey.50', borderColor: 'rgba(0,0,0,0.23)', color: 'text.disabled' };
    }
    if (!isComplete) {
      return { bgcolor: '#dbeafe', borderColor: '#3b82f6', color: '#1d4ed8' };
    }
    if (!hasError) {
      return { bgcolor: '#dcfce7', borderColor: '#22c55e', color: '#15803d' };
    }
    return { bgcolor: '#fef9c3', borderColor: '#eab308', color: '#a16207' };
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
      <Card
        sx={{
          boxShadow: isComplete
            ? hasError
              ? '0 0 0 3px #eab308, 0 4px 24px rgba(0,0,0,0.06)'
              : '0 0 0 3px #22c55e, 0 4px 24px rgba(0,0,0,0.06)'
            : '0 4px 24px rgba(0,0,0,0.10)',
          borderRadius: 4,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          {/* Prompt */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('exercises.letterPick.instruction')}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827' }}>
              {translation}
            </Typography>
          </Box>

          {/* Placed word display */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              mb: 4,
              flexWrap: 'wrap',
              justifyContent: 'center',
              minHeight: 64,
            }}
          >
            {wordHr.split('').map((char, idx) => {
              const style = getSlotStyle(idx);
              return (
                <Box
                  key={idx}
                  sx={{
                    width: 52,
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    borderColor: style.borderColor,
                    borderRadius: 2,
                    bgcolor: style.bgcolor,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: style.color, lineHeight: 1, userSelect: 'none' }}
                  >
                    {placed[idx] !== undefined ? char : '_'}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Letter pool — positions stay fixed, used letters become invisible spacers */}
          <Box
            sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            {pool.map((letter) =>
              letter.used ? (
                <Box key={letter.id} sx={{ width: 52, height: 52, flexShrink: 0 }} />
              ) : (
                <Button
                  key={letter.id}
                  variant="outlined"
                  onClick={() => processLetter(letter)}
                  disabled={isComplete}
                  sx={{
                    minWidth: 52,
                    width: 52,
                    height: 52,
                    p: 0,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    color: flashErrorId === letter.id ? 'error.main' : '#374151',
                    borderColor: flashErrorId === letter.id ? 'error.main' : 'rgba(0,0,0,0.23)',
                    '&:hover': { bgcolor: '#f3e8ff', borderColor: '#a855f7' },
                    transition: 'color 0.1s, border-color 0.1s',
                  }}
                >
                  {letter.char.toUpperCase()}
                </Button>
              ),
            )}
          </Box>

          {/* Reset button */}
          {placed.length > 0 && !isComplete && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={handleReset}
                sx={{ color: 'text.secondary', fontSize: '0.875rem' }}
              >
                {t('exercises.letterPick.reset')}
              </Button>
            </Box>
          )}

          {/* Feedback area — fixed min-height prevents layout jump */}
          <Box
            sx={{
              minHeight: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            {isComplete && !hasError && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                <CheckCircle sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('exercises.letterPick.perfect')}
                </Typography>
              </Box>
            )}
            {isComplete && hasError && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                <Cancel sx={{ fontSize: 28 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {t('exercises.letterPick.withErrors')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Action area */}
          {!isComplete && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LightbulbOutlined />}
                onClick={handleHint}
                sx={{ borderRadius: 2 }}
              >
                {t('exercises.letterPick.hint')}
              </Button>
            </Box>
          )}
          {isComplete && hasError && (
            <Button
              fullWidth
              size="large"
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: '#0f172a',
                borderRadius: 2,
                py: 1.75,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': { bgcolor: '#1e293b' },
              }}
            >
              {t('exercises.session.next')}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
