import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
import type { SingularPluralItem } from '@cro/shared';

import { getTranslation } from '../../shared/lib/content-utils';
import { useAppSelector } from '../../store';
import { TextInputExercise } from './TextInputExercise';

interface TypeTheAnswerExerciseProps {
  item: SingularPluralItem;
  onAnswer: (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => void;
  isLast: boolean;
}

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
