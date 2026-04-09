import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Button, Paper, Divider } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import type { FinishDictionaryPracticeResponse } from '@cro/shared';

interface LocationState {
  allResults: FinishDictionaryPracticeResponse[];
  collectionId?: string;
}

export function LearnWordsResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { allResults, collectionId } = (location.state as LocationState) ?? {};

  if (!allResults || allResults.length === 0) {
    navigate('/exercises/vocabulary/learn', { replace: true });
    return null;
  }

  const totalCorrect = allResults.reduce((sum, r) => sum + r.correctAnswers, 0);
  const totalQuestions = allResults.reduce((sum, r) => sum + r.totalQuestions, 0);
  const totalXp = allResults.reduce((sum, r) => sum + r.xpEarned, 0);
  const lastResult = allResults[allResults.length - 1];

  const dictionaryPath = collectionId
    ? `/dictionary/my?collectionId=${collectionId}`
    : '/dictionary/my';

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 1 }} />
        <Typography variant="h4" gutterBottom>
          {t('exercises.learnWords.resultsTitle')}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('exercises.learnWords.totalScore', { correct: totalCorrect, total: totalQuestions })}
        </Typography>
        {totalXp > 0 && (
          <Typography variant="body1" color="primary">
            {t('exercises.results.xpEarned', { xp: totalXp })}
          </Typography>
        )}
        {lastResult.currentStreak > 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('exercises.results.streak_one', { count: lastResult.currentStreak })}
          </Typography>
        )}
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/exercises/vocabulary/learn')}
          fullWidth
        >
          {t('exercises.learnWords.learnAgain')}
        </Button>
        <Button variant="outlined" size="large" onClick={() => navigate(dictionaryPath)} fullWidth>
          {t('exercises.learnWords.backToDictionary')}
        </Button>
      </Box>
    </Container>
  );
}
