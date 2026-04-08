import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField, Button, Card, CardContent, Box, Alert } from '@mui/material';

import { normalizeAnswer } from '../../../shared/lib/content-utils.ts';
import { useSpeech } from '../../../shared/hooks/useSpeech.ts';

const CORRECT_DELAY = Number(import.meta.env.VITE_CORRECT_DELAY_MS) || 1000;

interface TextInputExerciseProps {
  itemId: string;
  correctAnswer: string;
  placeholder: string;
  prompt: ReactNode;
  correctMessage: string;
  incorrectMessage: string;
  wordToSpeak?: string;
  onAnswer: (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => void;
}

export function TextInputExercise({
  itemId,
  correctAnswer,
  placeholder,
  prompt,
  correctMessage,
  incorrectMessage,
  wordToSpeak,
  onAnswer,
}: TextInputExerciseProps) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!checked || isCorrect) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNext();
      }
    };

    // Defer listener so it doesn't catch the same Enter that triggered handleCheck
    const frameId = requestAnimationFrame(() => {
      window.addEventListener('keydown', onKeyDown);
    });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [checked, isCorrect]);

  const handleCheck = () => {
    const correct = normalizeAnswer(input) === normalizeAnswer(correctAnswer);
    setIsCorrect(correct);
    setChecked(true);
    if (wordToSpeak) speak(wordToSpeak);
    if (correct) {
      timerRef.current = setTimeout(() => {
        onAnswer({ itemId, givenAnswer: input, isCorrect: correct });
      }, CORRECT_DELAY);
    }
  };

  const handleNext = () => {
    onAnswer({ itemId, givenAnswer: input, isCorrect });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') {
      if (!checked && input.trim()) {
        handleCheck();
      } else if (checked && !isCorrect) {
        handleNext();
      }
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        {prompt}

        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={checked}
          autoFocus
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ width: isCorrect ? '100%' : '80%' }}>
            {checked && (
              <Alert severity={isCorrect ? 'success' : 'error'}>
                {isCorrect ? correctMessage : incorrectMessage}
              </Alert>
            )}
          </Box>
          {!checked && (
            <Button variant="contained" onClick={handleCheck} disabled={!input.trim()}>
              {t('exercises.session.check')}
            </Button>
          )}
          {checked && !isCorrect && (
            <Button variant="contained" onClick={handleNext}>
              {t('exercises.session.next')}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
