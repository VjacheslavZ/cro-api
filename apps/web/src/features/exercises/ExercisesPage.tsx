/**
 * @module ExercisesPage
 * @description Grammar exercises home — lists all active topics as clickable cards.
 * Each card shows the topic's localized name and enabled exercise type chips.
 * Navigates to TopicExercisesPage on click.
 * @usedBy AppRouter (/exercises/grammar)
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Box,
  Alert,
  Button,
  Grid,
  Skeleton,
} from '@mui/material';
import {
  Keyboard as KeyboardIcon,
  Layers as LayersIcon,
  EditNote as EditNoteIcon,
} from '@mui/icons-material';
import { ExerciseType } from '@cro/shared';

import { useAppSelector } from '../../store';
import { useTopics } from '../../api/content';
import { getLocalizedName } from '../../shared/lib/content-utils';
import { getExerciseTypeLabel } from '../../shared/lib/exercise-utils';

const exerciseTypeIcons: Partial<Record<ExerciseType, React.ReactNode>> = {
  [ExerciseType.TYPE_THE_ANSWER]: <KeyboardIcon sx={{ fontSize: 12 }} />,
  [ExerciseType.FLASHCARDS]: <LayersIcon sx={{ fontSize: 12 }} />,
  [ExerciseType.FILL_IN_BLANK]: <EditNoteIcon sx={{ fontSize: 12 }} />,
};

export function ExercisesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { data: topics, isLoading, error, refetch } = useTopics();

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton width={240} height={40} sx={{ mb: 1 }} />
          <Skeleton width={380} height={24} />
        </Box>
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          }
        >
          {t('common.error')}
        </Alert>
      </Container>
    );
  }

  if (!topics?.length) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
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
            <LayersIcon sx={{ fontSize: 32, color: 'grey.400' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 1 }}>
            {t('exercises.noTopics')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            {t('exercises.noTopicsDesc')}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Page header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
          {t('exercises.title')}
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          {t('exercises.subtitle')}
        </Typography>
      </Box>

      {/* Topics grid */}
      <Grid container spacing={3}>
        {topics.map((topic) => (
          <Grid key={topic.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 2,
                transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  borderColor: '#93c5fd',
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(`/exercises/${topic.id}`)}
                sx={{ height: '100%', alignItems: 'flex-start' }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: '#111827', mb: 2, lineHeight: 1.4 }}
                  >
                    {getLocalizedName(topic, user?.nativeLanguage ?? null)}
                  </Typography>

                  {/* Exercise type pills */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {topic.exerciseTypes.map((type) => (
                      <Box
                        key={type}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.25,
                          py: 0.5,
                          bgcolor: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          lineHeight: 1,
                        }}
                      >
                        {exerciseTypeIcons[type]}
                        {getExerciseTypeLabel(type, t)}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
