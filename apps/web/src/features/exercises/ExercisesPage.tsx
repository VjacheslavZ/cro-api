/**
 * @module ExercisesPage
 * @description Grammar exercises home — lists all active topics as clickable cards.
 * Each card shows the topic's localized name and enabled exercise type chips.
 * Navigates to TopicExercisesPage on click.
 * @usedBy AppRouter (/exercises/grammar)
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExerciseType } from '@cro/shared';
import { KeyboardIcon, LayersIcon, PencilLineIcon } from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';
import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useAppSelector } from '../../store';
import { useTopics } from '../../api/content';
import { getLocalizedName } from '../../shared/lib/content-utils';
import { getExerciseTypeLabel } from '../../shared/lib/exercise-utils';

const exerciseTypeIcons: Partial<Record<ExerciseType, React.ReactNode>> = {
  [ExerciseType.TYPE_THE_ANSWER]: <KeyboardIcon />,
  [ExerciseType.FLASHCARDS]: <LayersIcon />,
  [ExerciseType.FILL_IN_BLANK]: <PencilLineIcon />,
};

export function ExercisesPage() {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const { data: topics, isLoading, error, refetch } = useTopics();

  if (isLoading) {
    return (
      <PageContainer size="lg" className="py-12">
        <div className="mb-8">
          <Skeleton className="mb-2 h-10 w-60" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-30 rounded-xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer size="lg" className="py-12">
        <ErrorAlert
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!topics?.length) {
    return (
      <PageContainer size="lg" className="py-12">
        <EmptyState
          icon={<LayersIcon />}
          title={t('exercises.noTopics')}
          description={t('exercises.noTopicsDesc')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="lg" className="py-12">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-bold text-foreground">{t('exercises.title')}</h1>
        <p className="text-muted-foreground">{t('exercises.subtitle')}</p>
      </div>

      {/* Topics grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            to={`/exercises/${topic.id}`}
            className="block h-full rounded-xl border bg-card p-6 transition-[box-shadow,border-color] outline-none hover:border-info hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <h2 className="mb-4 text-lg leading-snug font-semibold text-foreground">
              {getLocalizedName(topic, user?.nativeLanguage ?? null)}
            </h2>

            {/* Exercise type pills */}
            <div className="flex flex-wrap gap-1.5">
              {topic.exerciseTypes.map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="border-info-border bg-info-muted text-info-muted-foreground"
                >
                  {exerciseTypeIcons[type]}
                  {getExerciseTypeLabel(type, t)}
                </Badge>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
