/**
 * @module FillInBlankExercise
 * @description Fill-in-the-blank exercise: displays a Croatian sentence with `{{BLANK}}`
 * replaced by underscores and asks the user to type the missing word.
 * Wraps TextInputExercise with FILL_IN_BLANK-specific prompt.
 * Correct answer = FillInBlankItem.blankAnswer (compared via normalizeAnswer).
 * @usedBy SessionPage
 */
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
import type { FillInBlankItem } from '@cro/shared';

import { getTranslation } from '../../../shared/lib/content-utils.ts';
import { useAppSelector } from '../../../store';
import { TextInputExercise } from '../TextInputExercise/TextInputExercise.tsx';

interface FillInBlankExerciseProps {
  item: FillInBlankItem;
  onAnswer: (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => void;
  isLast: boolean;
}

function renderSentence(sentenceHr: string): string {
  return sentenceHr.replace('{{BLANK}}', '______');
}

/**
 * Renders the Fill-in-the-Blank prompt for a FillInBlankItem.
 * @param props.item - The exercise item; sentenceHr contains `{{BLANK}}` replaced with underscores
 * @param props.onAnswer - Forwarded to TextInputExercise; called with isCorrect based on blankAnswer match
 * @param props.isLast - Passed through to TextInputExercise (part of shared onAnswer contract)
 */
export function FillInBlankExercise({ item, onAnswer }: FillInBlankExerciseProps) {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <TextInputExercise
      itemId={item.id}
      correctAnswer={item.blankAnswer}
      placeholder={t('exercises.fillInBlank.placeholder')}
      correctMessage={t('exercises.fillInBlank.correct')}
      incorrectMessage={t('exercises.fillInBlank.incorrect', { answer: item.blankAnswer })}
      wordToSpeak={item.sentenceHr.replace('{{BLANK}}', item.blankAnswer)}
      onAnswer={onAnswer}
      prompt={
        <>
          <Typography variant="h6" gutterBottom>
            {t('exercises.fillInBlank.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('exercises.fillInBlank.instruction')}
          </Typography>
          <Typography variant="h5" sx={{ mb: 1, textAlign: 'center' }}>
            {renderSentence(item.sentenceHr)}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            {getTranslation(item, user?.nativeLanguage ?? null)}
          </Typography>
        </>
      }
    />
  );
}
