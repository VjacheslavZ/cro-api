import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Button, Box, Alert } from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';

interface ResultsLocationState {
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  currentStreak: number;
}

export function DictionaryPracticeResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;

  if (!state) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
      <EmojiEvents sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />

      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('dictionary.practice.results')}
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        {t('exercises.results.score', {
          correct: state.correctAnswers,
          total: state.totalQuestions,
        })}
      </Typography>

      <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
        {t('exercises.results.xpEarned', { xp: state.xpEarned })}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('exercises.results.streak', { count: state.currentStreak })}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="contained" onClick={() => navigate('/dictionary/my')}>
          {t('dictionary.practice.backToDictionary')}
        </Button>
        <Button variant="outlined" onClick={() => navigate('/dictionary/my')}>
          {t('dictionary.practice.practiceAgain')}
        </Button>
      </Box>
    </Container>
  );
}
