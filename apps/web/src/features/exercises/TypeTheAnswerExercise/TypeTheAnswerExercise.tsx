/**
 * @module TypeTheAnswerExercise
 * @description Type-the-Answer exercise: shows a Croatian noun in its base form and asks
 * the user to type its plural. Wraps TextInputExercise with TYPE_THE_ANSWER-specific prompt.
 * Correct answer = TypeTheAnswerItem.answer (compared via normalizeAnswer).
 * @usedBy SessionPage
 */
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import type { TypeTheAnswerItem } from '@cro/shared';

import { getTranslation } from '../../../shared/lib/content-utils.ts';
import { useAppSelector } from '../../../store';
import { TextInputExercise } from '../TextInputExercise/TextInputExercise.tsx';

interface TypeTheAnswerExerciseProps {
  item: TypeTheAnswerItem;
  onAnswer: (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => void;
  isLast: boolean;
}

/**
 * Renders the Type-the-Answer prompt for a TypeTheAnswerItem.
 * @param props.item - The exercise item; displays baseForm, prompts for answer
 * @param props.onAnswer - Forwarded to TextInputExercise; called with isCorrect based on answer match
 * @param props.isLast - Passed through to TextInputExercise (part of shared onAnswer contract)
 */
export function TypeTheAnswerExercise({ item, onAnswer }: TypeTheAnswerExerciseProps) {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const translation = getTranslation(item, user?.nativeLanguage ?? null);

  return (
    <TextInputExercise
      itemId={item.id}
      correctAnswer={item.answer}
      placeholder={t('exercises.typeTheAnswer.placeholder')}
      correctMessage={t('exercises.typeTheAnswer.correct')}
      incorrectMessage={t('exercises.typeTheAnswer.incorrect', { answer: item.answer })}
      wordToSpeak={item.answer}
      onAnswer={onAnswer}
      prompt={
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('exercises.typeTheAnswer.instruction')}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
            {item.baseForm}
          </Typography>
          {translation && (
            <Typography variant="body2" color="text.secondary">
              ({translation})
            </Typography>
          )}
        </Box>
      }
    />
  );
}
