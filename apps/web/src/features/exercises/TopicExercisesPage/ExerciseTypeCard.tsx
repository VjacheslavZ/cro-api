import { useTranslation } from 'react-i18next';
import type { ExerciseType } from '@cro/shared';
import { ArrowRightIcon, Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  getExerciseTypeLabel,
  getExerciseTypeDescription,
} from '../../../shared/lib/exercise-utils.ts';
import { getExerciseTypeIcon } from './exerciseTypeIcon.tsx';

interface Props {
  type: ExerciseType;
  isPending: boolean;
  onStart: () => void;
}

export function ExerciseTypeCard({ type, isPending, onStart }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-6 rounded-xl border bg-card p-6 transition-[box-shadow,border-color] hover:border-info hover:shadow-lg">
      <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted">
        {getExerciseTypeIcon(type)}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="mb-0.5 text-lg font-semibold text-foreground">
          {getExerciseTypeLabel(type, t)}
        </h3>
        <p className="text-sm text-muted-foreground">{getExerciseTypeDescription(type, t)}</p>
      </div>

      <Button className="min-w-30 shrink-0" onClick={onStart} disabled={isPending}>
        {t('exercises.start')}
        {isPending ? (
          <Loader2Icon className="animate-spin" data-icon="inline-end" />
        ) : (
          <ArrowRightIcon data-icon="inline-end" />
        )}
      </Button>
    </div>
  );
}
