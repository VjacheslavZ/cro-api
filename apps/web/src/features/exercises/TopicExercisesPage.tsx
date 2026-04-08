import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Alert, Button, Card, CardContent } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import type { ExerciseTopic } from '@cro/shared';

import { QueryState } from '../../shared/components/QueryState';
import { useAppSelector } from '../../store';
import { apiClient } from '../../api/client';
import { useCreateSession } from '../../api/exercises';
import type { CreateSessionResponse } from '../../api/exercises';
import { getLocalizedName, getRulesHtml } from '../../shared/lib/content-utils';
import { getExerciseTypeLabel } from '../../shared/lib/exercise-utils';
import { CycleResetDialog } from './CycleResetDialog';

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
      // Error is handled by mutation state
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

  const queryState = QueryState({
    isLoading: isLoading || !!autoStartState?.autoStartExerciseType,
    isError: !!error || !topic,
  });
  if (queryState) return queryState;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/exercises')} sx={{ mb: 2 }}>
        {t('exercises.title')}
      </Button>

      <Typography variant="h4" gutterBottom>
        {topic && getLocalizedName(topic, user?.nativeLanguage ?? null)}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('exercises.chooseType')}
      </Typography>

      {topic?.exerciseTypes.length === 0 && (
        <Typography color="text.secondary">{t('exercises.noTypes')}</Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {topic?.exerciseTypes.map((type) => (
          <Card key={type} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{getExerciseTypeLabel(type, t)}</Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleStartExercise(type)}
                  disabled={createSession.isPending}
                >
                  {t('exercises.start')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

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
    </Container>
  );
}
