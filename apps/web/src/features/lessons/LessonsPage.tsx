import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { MenuBook as MenuBookIcon, Quiz as TopicIcon } from '@mui/icons-material';
import { LessonItemType } from '@cro/shared';

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
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton width={200} height={40} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={160} />
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
              Retry
            </Button>
          }
        >
          Failed to load lessons
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        {t('nav.lessons')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('lessons.subtitle')}
      </Typography>

      {lessons?.length === 0 && (
        <Typography color="text.secondary">{t('lessons.empty')}</Typography>
      )}

      <Grid container spacing={3}>
        {lessons?.map((lesson) => {
          const title = getLessonTitle(lesson, user?.nativeLanguage ?? null);
          const description = getLessonDescription(lesson, user?.nativeLanguage ?? null);

          return (
            <Grid key={lesson.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {title}
                  </Typography>
                  {description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {description}
                    </Typography>
                  )}
                  {lesson.items.length > 0 ? (
                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 'auto' }}>
                      {lesson.items.map((item) => (
                        <Chip
                          key={item.id}
                          icon={
                            item.itemType === LessonItemType.EXERCISE_TOPIC ? (
                              <TopicIcon sx={{ fontSize: 14 }} />
                            ) : (
                              <MenuBookIcon sx={{ fontSize: 14 }} />
                            )
                          }
                          label={item.itemName}
                          size="small"
                          variant="outlined"
                          color={
                            item.itemType === LessonItemType.EXERCISE_TOPIC
                              ? 'primary'
                              : 'secondary'
                          }
                          onClick={() =>
                            item.itemType === LessonItemType.EXERCISE_TOPIC
                              ? navigate(`/exercises/${item.itemId}`)
                              : navigate(`/dictionary/collections/${item.itemId}`)
                          }
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <Chip label={t('lessons.noItems')} size="small" variant="outlined" />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
