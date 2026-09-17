/**
 * @module TopicExercisesPage
 * @description Exercise type selector for a single topic. Fetches the topic, lists enabled
 * exercise types, creates a session on click, and handles cycle exhaustion via CycleResetDialog.
 * Supports auto-starting an exercise type when navigated back from SessionResultsPage
 * (via location.state.autoStartExerciseType).
 * @usedBy AppRouter (/exercises/:topicId)
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { ExerciseTopic } from '@cro/shared';
import { ArrowLeftIcon } from 'lucide-react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useAppSelector } from '../../../store';
import { apiClient } from '../../../api/client.ts';
import { useCreateSession } from '../../../api/exercises.ts';
import type { CreateSessionResponse } from '../../../api/exercises.ts';
import { getLocalizedName, getRulesHtml } from '../../../shared/lib/content-utils.ts';
import { CycleResetDialog } from '../CycleResetDialog.tsx';
import { ExerciseTypeList } from './ExerciseTypeList.tsx';

/**
 * Renders exercise type cards for a topic and handles session creation.
 * On `cycleExhausted` response, shows CycleResetDialog instead of navigating.
 * Uses `autoStarted` ref to prevent double-firing in React 18 StrictMode.
 */
export function TopicExercisesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { topicId } = useParams<{ topicId: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const createSession = useCreateSession();
  const autoStarted = useRef(false);

  const {
    data: topic,
    isLoading,
    error,
  } = useQuery<ExerciseTopic>({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/content/topics/${topicId}`);
      return data;
    },
    enabled: !!topicId,
  });

  const [cycleResetInfo, setCycleResetInfo] = useState<{
    topicId: string;
    exerciseType: string;
  } | null>(null);

  const handleStartExercise = async (exerciseType: string) => {
    try {
      const result: CreateSessionResponse = await createSession.mutateAsync({
        topicId: topicId!,
        exerciseType,
      });
      if (result.cycleExhausted) {
        setCycleResetInfo({ topicId: topicId!, exerciseType });
        return;
      }
      if (result.session) {
        navigate(`/exercises/session/${result.session.id}`, {
          state: {
            items: result.session.items,
            exerciseType: result.session.exerciseType,
            totalQuestions: result.session.totalQuestions,
            rulesHtml: getRulesHtml(result.session, user?.nativeLanguage ?? null),
          },
        });
      }
    } catch {
      // Error handled by mutation state
    }
  };

  useEffect(() => {
    const state = location.state as { autoStartExerciseType?: string } | null;
    if (state?.autoStartExerciseType && !autoStarted.current) {
      autoStarted.current = true;
      navigate(location.pathname, { replace: true, state: null });
      handleStartExercise(state.autoStartExerciseType);
    }
  }, [location.state]);

  const autoStartState = location.state as { autoStartExerciseType?: string } | null;
  const isPageLoading = isLoading || !!autoStartState?.autoStartExerciseType;

  if (isPageLoading) {
    return (
      <PageContainer size="md" className="py-12">
        <div className="mx-auto max-w-3xl">
          <Skeleton className="mb-6 h-9 w-35" />
          <Skeleton className="mb-2 h-11 w-65" />
          <Skeleton className="mb-8 h-6 w-55" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-25 rounded-xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !topic) {
    return (
      <PageContainer size="md" className="py-12">
        <div className="mx-auto max-w-3xl">
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/exercises')}>
            <ArrowLeftIcon data-icon="inline-start" />
            {t('exercises.title')}
          </Button>
          <ErrorAlert />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="md" className="py-12">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/exercises')}>
          <ArrowLeftIcon data-icon="inline-start" />
          {t('exercises.title')}
        </Button>
        <h1 className="mb-1 text-3xl font-bold text-foreground">
          {getLocalizedName(topic, user?.nativeLanguage ?? null)}
        </h1>
        <p className="mb-8 text-muted-foreground">{t('exercises.chooseType')}</p>

        <ExerciseTypeList
          exerciseTypes={topic.exerciseTypes}
          isPending={createSession.isPending}
          isError={createSession.isError}
          onStart={handleStartExercise}
        />

        <CycleResetDialog
          open={cycleResetInfo !== null}
          onReset={() => {
            if (cycleResetInfo) handleStartExercise(cycleResetInfo.exerciseType);
            setCycleResetInfo(null);
          }}
          onClose={() => setCycleResetInfo(null)}
          topicId={cycleResetInfo?.topicId ?? ''}
          exerciseType={cycleResetInfo?.exerciseType ?? ''}
        />
      </div>
    </PageContainer>
  );
}
