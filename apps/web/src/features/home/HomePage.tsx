import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MenuBook as MenuBookIcon,
  LibraryBooks as LibraryBooksIcon,
  LocalFireDepartment as FlameIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { Box, Container, Typography, Grid, Card, CardContent, Button } from '@mui/material';

import { useAppSelector } from '../../store';
import { useTopics } from '../../api/content';
import { useDictionaryWordCount } from '../../api/dictionary';

export function HomePage() {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const { data: topics } = useTopics();
  const { data: wordCount } = useDictionaryWordCount();

  const stats = [
    {
      icon: <MenuBookIcon />,
      iconColor: '#2563eb',
      bgColor: '#dbeafe',
      value: topics?.length ?? '—',
      label: t('home.statsGrammarTopics'),
    },
    {
      icon: <LibraryBooksIcon />,
      iconColor: '#7c3aed',
      bgColor: '#ede9fe',
      value: wordCount ?? 0,
      label: t('home.statsWordsLearned'),
    },
    {
      icon: <FlameIcon />,
      iconColor: '#ea580c',
      bgColor: '#ffedd5',
      value: user?.currentStreak ?? 0,
      label: t('home.statsDayStreak'),
    },
    {
      icon: <StarIcon />,
      iconColor: '#d97706',
      bgColor: '#fef3c7',
      value: user?.xpTotal ?? 0,
      label: t('home.statsTotalXp'),
    },
  ];

  const actions = [
    {
      title: t('home.practiceGrammarTitle'),
      description: t('home.practiceGrammarDesc'),
      btnLabel: t('home.practiceGrammarBtn'),
      href: '/exercises/grammar',
      variant: 'contained' as const,
    },
    {
      title: t('home.buildVocabTitle'),
      description: t('home.buildVocabDesc'),
      btnLabel: t('home.buildVocabBtn'),
      href: '/dictionary/my',
      variant: 'outlined' as const,
    },
    {
      title: t('home.wordSetsTitle'),
      description: t('home.wordSetsDesc'),
      btnLabel: t('home.wordSetsBtn'),
      href: '/dictionary/recommended-word-sets',
      variant: 'outlined' as const,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Hero */}
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, color: '#111827', mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
        >
          {t('home.title')}
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: '#6b7280', maxWidth: 600, mx: 'auto', fontWeight: 400, lineHeight: 1.6 }}
        >
          {t('home.subtitle')}
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 8 }}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
              <CardContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: stat.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Box sx={{ color: stat.iconColor, display: 'flex' }}>{stat.icon}</Box>
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action cards */}
      <Grid container spacing={3} sx={{ maxWidth: 960, mx: 'auto' }}>
        {actions.map((action) => (
          <Grid key={action.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.15s ease',
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', mb: 3, flex: 1 }}>
                  {action.description}
                </Typography>
                <Button
                  component={RouterLink}
                  to={action.href}
                  variant={action.variant}
                  size="large"
                  fullWidth
                >
                  {action.btnLabel}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
