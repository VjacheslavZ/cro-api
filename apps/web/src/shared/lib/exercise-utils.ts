import { ExerciseType } from '@cro/shared';
import type { TFunction } from 'i18next';

export function getExerciseTypeLabel(type: ExerciseType, t: TFunction): string {
  switch (type) {
    case ExerciseType.TYPE_THE_ANSWER:
      return t('exercises.types.typeTheAnswer');
    case ExerciseType.FLASHCARDS:
      return t('exercises.types.flashcards');
    case ExerciseType.FILL_IN_BLANK:
      return t('exercises.types.fillInBlank');
    default:
      return type;
  }
}

export function getExerciseTypeDescription(type: ExerciseType, t: TFunction): string {
  switch (type) {
    case ExerciseType.TYPE_THE_ANSWER:
      return t('exercises.types.typeTheAnswerDesc');
    case ExerciseType.FLASHCARDS:
      return t('exercises.types.flashcardsDesc');
    case ExerciseType.FILL_IN_BLANK:
      return t('exercises.types.fillInBlankDesc');
    default:
      return '';
  }
}
