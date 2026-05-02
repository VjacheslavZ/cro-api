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
import { Alert, Box, Button, Container, Skeleton, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import type { ExerciseTopic } from '@cro/shared';

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
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ maxWidth: 768, mx: 'auto' }}>
          <Skeleton width={140} height={36} sx={{ mb: 3 }} />
          <Skeleton width={260} height={44} sx={{ mb: 1 }} />
          <Skeleton width={220} height={24} sx={{ mb: 4 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={100} />
            ))}
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !topic) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ maxWidth: 768, mx: 'auto' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/exercises')} sx={{ mb: 3 }}>
            {t('exercises.title')}
          </Button>
          <Alert severity="error">{t('common.error')}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ maxWidth: 768, mx: 'auto' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/exercises')} sx={{ mb: 3 }}>
          {t('exercises.title')}
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
          {getLocalizedName(topic, user?.nativeLanguage ?? null)}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('exercises.chooseType')}
        </Typography>

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
      </Box>
    </Container>
  );
}
