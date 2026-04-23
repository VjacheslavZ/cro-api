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
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { ArrowBack, ArrowForward, Keyboard, ViewCarousel, Edit, Layers } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import type { ExerciseTopic, ExerciseType } from '@cro/shared';
import { ExerciseType as ExerciseTypeEnum } from '@cro/shared';

import { useAppSelector } from '../../store';
import { apiClient } from '../../api/client';
import { useCreateSession } from '../../api/exercises';
import type { CreateSessionResponse } from '../../api/exercises';
import { getLocalizedName, getRulesHtml } from '../../shared/lib/content-utils';
import { getExerciseTypeLabel, getExerciseTypeDescription } from '../../shared/lib/exercise-utils';
import { CycleResetDialog } from './CycleResetDialog';

function getExerciseTypeIcon(type: ExerciseType) {
  switch (type) {
    case ExerciseTypeEnum.TYPE_THE_ANSWER:
      return <Keyboard sx={{ fontSize: 32, color: '#2563eb' }} />;
    case ExerciseTypeEnum.FLASHCARDS:
      return <ViewCarousel sx={{ fontSize: 32, color: '#9333ea' }} />;
    case ExerciseTypeEnum.FILL_IN_BLANK:
      return <Edit sx={{ fontSize: 32, color: '#16a34a' }} />;
    default:
      return <Layers sx={{ fontSize: 32, color: '#6b7280' }} />;
  }
}

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

  const handleCycleReset = () => {
    if (cycleResetInfo) {
      handleStartExercise(cycleResetInfo.exerciseType);
    }
    setCycleResetInfo(null);
  };

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
        {/* Back button */}
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/exercises')} sx={{ mb: 3 }}>
          {t('exercises.title')}
        </Button>

        {/* Page title */}
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
          {getLocalizedName(topic, user?.nativeLanguage ?? null)}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('exercises.chooseType')}
        </Typography>

        {/* Exercise type cards */}
        {topic.exerciseTypes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'grey.100',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Layers sx={{ fontSize: 32, color: 'grey.400' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
              {t('exercises.noTypes')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topic.exerciseTypes.map((type) => (
              <Box
                key={type}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  p: 3,
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 2,
                  bgcolor: 'white',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    borderColor: '#93c5fd',
                  },
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 64,
                    height: 64,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getExerciseTypeIcon(type)}
                </Box>

                {/* Label + description */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.25 }}>
                    {getExerciseTypeLabel(type, t)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getExerciseTypeDescription(type, t)}
                  </Typography>
                </Box>

                {/* Start button */}
                <Button
                  variant="contained"
                  endIcon={
                    createSession.isPending ? (
                      <CircularProgress size={16} sx={{ color: 'inherit' }} />
                    ) : (
                      <ArrowForward />
                    )
                  }
                  onClick={() => handleStartExercise(type)}
                  disabled={createSession.isPending}
                  sx={{ flexShrink: 0, minWidth: 120 }}
                >
                  {t('exercises.start')}
                </Button>
              </Box>
            ))}
          </Box>
        )}

        {createSession.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {t('common.error')}
          </Alert>
        )}

        <CycleResetDialog
          open={cycleResetInfo !== null}
          onReset={handleCycleReset}
          onClose={() => setCycleResetInfo(null)}
          topicId={cycleResetInfo?.topicId ?? ''}
          exerciseType={cycleResetInfo?.exerciseType ?? ''}
        />
      </Box>
    </Container>
  );
}
