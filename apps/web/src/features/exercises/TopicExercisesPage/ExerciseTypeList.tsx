import { useTranslation } from 'react-i18next';
import type { ExerciseType } from '@cro/shared';
import { LayersIcon } from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';
import { ErrorAlert } from '@/components/ErrorAlert';

import { ExerciseTypeCard } from './ExerciseTypeCard.tsx';

interface Props {
  exerciseTypes: ExerciseType[];
  isPending: boolean;
  isError: boolean;
  onStart: (type: string) => void;
}

export function ExerciseTypeList({ exerciseTypes, isPending, isError, onStart }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {exerciseTypes.length === 0 ? (
        <EmptyState icon={<LayersIcon />} title={t('exercises.noTypes')} />
      ) : (
        <div className="flex flex-col gap-4">
          {exerciseTypes.map((type) => (
            <ExerciseTypeCard
              key={type}
              type={type}
              isPending={isPending}
              onStart={() => onStart(type)}
            />
          ))}
        </div>
      )}

      {isError && <ErrorAlert className="mt-4" />}
    </>
  );
}
