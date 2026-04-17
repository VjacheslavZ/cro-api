/**
 * @module TextInputExercise
 * @description Generic text-input exercise component. Shows a prompt, accepts a typed answer,
 * checks it via normalizeAnswer, and calls onAnswer. Used by TypeTheAnswerExercise,
 * FillInBlankExercise, and dictionary practice (word-to-translate, translate-to-word).
 * On correct answer: auto-advances after VITE_CORRECT_DELAY_MS (default 1000ms).
 * On incorrect: shows the error and waits for user to press "Next" or Enter.
 * Keyboard shortcut: Enter to check (when input is non-empty), Enter again to advance.
 * @usedBy TypeTheAnswerExercise, FillInBlankExercise, LearnWordsSessionPage, DictionaryPracticePage
 */
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Box,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

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

/**
 * Renders a text-input exercise with check/next flow and optional speech on answer reveal.
 * @param props.itemId - ID passed through to onAnswer unchanged (wordId or itemId)
 * @param props.correctAnswer - The expected answer; compared after normalizeAnswer (trim + lowercase + NFC)
 * @param props.placeholder - Input field placeholder text
 * @param props.prompt - ReactNode rendered above the input (question text, word, image, etc.)
 * @param props.correctMessage - Alert text shown on correct answer
 * @param props.incorrectMessage - Alert text shown on incorrect answer (typically includes the correct answer)
 * @param props.wordToSpeak - Croatian word spoken aloud when the answer is revealed; omit to disable speech
 * @param props.onAnswer - Called with `{ itemId, givenAnswer, isCorrect }` once the user confirms their answer
 */
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
  // Use a ref so handleCheck always reads the latest value synchronously
  const hintUsedRef = useRef(false);

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

  const handleHint = () => {
    if (checked) return;
    hintUsedRef.current = true;

    let correctPrefixLen = 0;
    for (let i = 0; i < input.length && i < correctAnswer.length; i++) {
      if (
        input[i].normalize('NFC').toLowerCase() === correctAnswer[i].normalize('NFC').toLowerCase()
      ) {
        correctPrefixLen = i + 1;
      } else {
        break;
      }
    }

    const nextChar = correctAnswer[correctPrefixLen];
    if (nextChar === undefined) return;

    const newInput = correctAnswer.slice(0, correctPrefixLen) + nextChar;
    setInput(newInput);
    if (normalizeAnswer(newInput) === normalizeAnswer(correctAnswer)) {
      handleCheck(newInput);
    }
  };

  const handleCheck = (currentInput = input) => {
    const correct =
      !hintUsedRef.current && normalizeAnswer(currentInput) === normalizeAnswer(correctAnswer);
    setIsCorrect(correct);
    setChecked(true);
    if (wordToSpeak) speak(wordToSpeak);
    if (correct) {
      timerRef.current = setTimeout(() => {
        onAnswer({ itemId, givenAnswer: currentInput, isCorrect: correct });
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
          onChange={(e) => {
            const value = e.target.value;
            setInput(value);
            if (!checked && normalizeAnswer(value) === normalizeAnswer(correctAnswer)) {
              handleCheck(value);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={checked}
          autoFocus
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              endAdornment: !checked && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleHint}
                    title={t('exercises.session.hint')}
                    edge="end"
                  >
                    <HelpOutline fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
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
            <Button variant="contained" onClick={() => handleCheck()} disabled={!input.trim()}>
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
