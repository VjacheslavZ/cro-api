/**
 * @module FillInBlankExercise
 * @description Fill-in-the-blank exercise: displays a Croatian sentence with `{{BLANK}}`
 * replaced by underscores and asks the user to type the missing word.
 * Wraps TextInputExercise with FILL_IN_BLANK-specific prompt.
 * Correct answer = FillInBlankItem.blankAnswer (compared via normalizeAnswer).
 * @usedBy SessionPage
 */
import { useTranslation } from 'react-i18next';
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
          <h2 className="mb-1 text-lg font-medium">{t('exercises.fillInBlank.title')}</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('exercises.fillInBlank.instruction')}
          </p>
          <p className="mb-2 text-center text-2xl">{renderSentence(item.sentenceHr)}</p>
          <p className="mb-6 text-center text-muted-foreground">
            {getTranslation(item, user?.nativeLanguage ?? null)}
          </p>
        </>
      }
    />
  );
}
