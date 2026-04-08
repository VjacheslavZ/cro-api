import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Translate, TextFields } from '@mui/icons-material';

import { useStartDictionaryPractice } from '../../api/dictionary';

const SESSION_WORD_COUNT = 10;

export function VocabularyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const startPractice = useStartDictionaryPractice();

  const handleStart = async (direction: 'word-to-translate' | 'translate-to-word') => {
    try {
      const result = await startPractice.mutateAsync({ count: SESSION_WORD_COUNT });
      navigate(`/dictionary/practice/${result.sessionId}`, {
        state: {
          items: result.items,
          totalQuestions: result.totalQuestions,
          direction,
          backPath: '/exercises/vocabulary',
        },
      });
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('exercises.vocabulary.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('exercises.vocabulary.subtitle')}
      </Typography>

      {startPractice.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('dictionary.practice.noWords')}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card variant="outlined">
          <CardActionArea
            onClick={() => handleStart('word-to-translate')}
            disabled={startPractice.isPending}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {startPractice.isPending ? (
                <CircularProgress size={24} />
              ) : (
                <Translate color="primary" />
              )}
              <Box>
                <Typography variant="h6">{t('exercises.vocabulary.wordToTranslate')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('exercises.vocabulary.wordToTranslateDesc')}
                </Typography>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card variant="outlined">
          <CardActionArea
            onClick={() => handleStart('translate-to-word')}
            disabled={startPractice.isPending}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {startPractice.isPending ? (
                <CircularProgress size={24} />
              ) : (
                <TextFields color="primary" />
              )}
              <Box>
                <Typography variant="h6">{t('exercises.vocabulary.translateToWord')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('exercises.vocabulary.translateToWordDesc')}
                </Typography>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Container>
  );
}
