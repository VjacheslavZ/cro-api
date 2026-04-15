/**
 * @module TypeTheAnswerExercise
 * @description Type-the-Answer exercise: shows a Croatian noun in its base form and asks
 * the user to type its plural. Wraps TextInputExercise with TYPE_THE_ANSWER-specific prompt.
 * Correct answer = TypeTheAnswerItem.pluralForm (compared via normalizeAnswer).
 * @usedBy SessionPage
 */
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
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
 * @param props.item - The exercise item; displays baseForm, prompts for pluralForm
 * @param props.onAnswer - Forwarded to TextInputExercise; called with isCorrect based on pluralForm match
 * @param props.isLast - Passed through to TextInputExercise (part of shared onAnswer contract)
 */
export function TypeTheAnswerExercise({ item, onAnswer }: TypeTheAnswerExerciseProps) {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <TextInputExercise
      itemId={item.id}
      correctAnswer={item.pluralForm}
      placeholder={t('exercises.typeTheAnswer.placeholder')}
      correctMessage={t('exercises.typeTheAnswer.correct')}
      incorrectMessage={t('exercises.typeTheAnswer.incorrect', { answer: item.pluralForm })}
      wordToSpeak={item.pluralForm}
      onAnswer={onAnswer}
      prompt={
        <>
          <Typography variant="h6" gutterBottom>
            {t('exercises.typeTheAnswer.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('exercises.typeTheAnswer.instruction')}
          </Typography>
          <Typography variant="h4" sx={{ mb: 1, textAlign: 'center' }}>
            {item.baseForm}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            {getTranslation(item, user?.nativeLanguage ?? null)}
          </Typography>
        </>
      }
    />
  );
}
