import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LessonItemType } from '@cro/shared';
import { BookOpenIcon, ListChecksIcon } from 'lucide-react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useAppSelector } from '../../store';
import { useLessons } from '../../api/lessons';
import { getLessonTitle, getLessonDescription } from '../../shared/lib/content-utils';

export function LessonsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { data: lessons, isLoading, error, refetch } = useLessons();

  if (isLoading) {
    return (
      <PageContainer size="lg" className="py-12">
        <Skeleton className="mb-8 h-10 w-50" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer size="lg" className="py-12">
        <ErrorAlert
          message="Failed to load lessons"
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="lg" className="py-12">
      <h1 className="mb-2 text-3xl font-bold">{t('nav.lessons')}</h1>
      <p className="mb-8 text-muted-foreground">{t('lessons.subtitle')}</p>

      {lessons?.length === 0 && <p className="text-muted-foreground">{t('lessons.empty')}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {lessons?.map((lesson) => {
          const title = getLessonTitle(lesson, user?.nativeLanguage ?? null);
          const description = getLessonDescription(lesson, user?.nativeLanguage ?? null);

          return (
            <div key={lesson.id} className="flex h-full flex-col rounded-xl border bg-card p-6">
              <h2 className="mb-1 text-lg font-semibold">{title}</h2>
              {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
              {lesson.items.length > 0 ? (
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {lesson.items.map((item) => {
                    const isTopic = item.itemType === LessonItemType.EXERCISE_TOPIC;
                    return (
                      <Badge
                        key={item.id}
                        render={<button type="button" />}
                        variant="outline"
                        className={
                          isTopic
                            ? 'h-6 cursor-pointer border-primary text-primary hover:bg-info-muted'
                            : 'h-6 cursor-pointer border-violet-500 text-violet-700 hover:bg-violet-50'
                        }
                        onClick={() =>
                          navigate(
                            isTopic
                              ? `/exercises/${item.itemId}`
                              : `/dictionary/collections/${item.itemId}`,
                          )
                        }
                      >
                        {isTopic ? <ListChecksIcon /> : <BookOpenIcon />}
                        {item.itemName}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-2">
                  <Badge variant="outline">{t('lessons.noItems')}</Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
