/**
 * @module TypeTheAnswerExercise
 * @description Type-the-Answer exercise: shows a Croatian noun in its base form and asks
 * the user to type its plural. Wraps TextInputExercise with TYPE_THE_ANSWER-specific prompt.
 * Correct answer = TypeTheAnswerItem.answer (compared via normalizeAnswer).
 * @usedBy SessionPage
 */
import { useTranslation } from 'react-i18next';
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
        <div className="mb-8 text-center">
          <p className="mb-6 text-muted-foreground">{t('exercises.typeTheAnswer.instruction')}</p>
          <p className="mb-2 text-4xl font-bold text-foreground">{item.baseForm}</p>
          {translation && <p className="text-sm text-muted-foreground">({translation})</p>}
        </div>
      }
    />
  );
}
