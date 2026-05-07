import { Edit, Keyboard, Layers, Sort, ViewCarousel } from '@mui/icons-material';
import type { ExerciseType } from '@cro/shared';
import { ExerciseType as ExerciseTypeEnum } from '@cro/shared';

export function getExerciseTypeIcon(type: ExerciseType) {
  switch (type) {
    case ExerciseTypeEnum.TYPE_THE_ANSWER:
      return <Keyboard sx={{ fontSize: 32, color: '#2563eb' }} />;
    case ExerciseTypeEnum.FLASHCARDS:
      return <ViewCarousel sx={{ fontSize: 32, color: '#9333ea' }} />;
    case ExerciseTypeEnum.FILL_IN_BLANK:
      return <Edit sx={{ fontSize: 32, color: '#16a34a' }} />;
    case ExerciseTypeEnum.BUILD_SENTENCE:
      return <Sort sx={{ fontSize: 32, color: '#d97706' }} />;
    default:
      return <Layers sx={{ fontSize: 32, color: '#6b7280' }} />;
  }
}
