import type { ExerciseType } from '@cro/shared';
import { ExerciseType as ExerciseTypeEnum } from '@cro/shared';
import {
  ArrowDownUpIcon,
  GalleryHorizontalIcon,
  KeyboardIcon,
  LayersIcon,
  PencilIcon,
} from 'lucide-react';

export function getExerciseTypeIcon(type: ExerciseType) {
  switch (type) {
    case ExerciseTypeEnum.TYPE_THE_ANSWER:
      return <KeyboardIcon className="size-8 text-primary" />;
    case ExerciseTypeEnum.FLASHCARDS:
      return <GalleryHorizontalIcon className="size-8 text-purple-600" />;
    case ExerciseTypeEnum.FILL_IN_BLANK:
      return <PencilIcon className="size-8 text-success" />;
    case ExerciseTypeEnum.BUILD_SENTENCE:
      return <ArrowDownUpIcon className="size-8 text-amber-600" />;
    default:
      return <LayersIcon className="size-8 text-muted-foreground" />;
  }
}
