/**
 * @module LearnWordsPreviewPage
 * @description Step 2 of the Learn Words flow. Shows words one at a time (Croatian + translation)
 * and speaks each word via useSpeech on display. User pages through all words before starting
 * the exercise session. On the last word, "Next" navigates to LearnWordsSessionPage.
 * @usedBy AppRouter (/exercises/vocabulary/learn/preview)
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import type { DictionaryWord } from '@cro/shared';

import { useSpeech } from '../../../shared/hooks/useSpeech';

interface LocationState {
  words: DictionaryWord[];
  collectionId?: string;
}

/**
 * Renders the word preview carousel with speech and progress dots.
 * Redirects to setup page if location state is missing (direct URL access or empty word list).
 */
export function LearnWordsPreviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { words, collectionId } = (location.state as LocationState) ?? {};

  const [index, setIndex] = useState(0);
  const { speak } = useSpeech();

  useEffect(() => {
    if (words?.[index]?.wordHr) speak(words[index].wordHr);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [index]);

  if (!words || words.length === 0) {
    navigate('/exercises/vocabulary/learn', { replace: true });
    return null;
  }

  const current = words[index];
  const isLast = index === words.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/exercises/vocabulary/learn/session', {
        state: { words, collectionId },
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/exercises/vocabulary/learn')}
        sx={{ mb: 2 }}
      >
        {t('exercises.learnWords.setupTitle')}
      </Button>

      <Typography variant="h5" gutterBottom>
        {t('exercises.learnWords.previewTitle')}
      </Typography>

      {/* Progress dots */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 3, flexWrap: 'wrap' }}>
        {words.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: i === index ? 'primary.main' : i < index ? 'primary.light' : 'grey.300',
            }}
          />
        ))}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('exercises.learnWords.wordOf', { current: index + 1, total: words.length })}
      </Typography>

      <Paper
        elevation={2}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          minHeight: 180,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h3" fontWeight={700}>
          {current.wordHr}
        </Typography>
        <Typography variant="h5" color="text.secondary">
          {current.translation}
        </Typography>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" size="large" onClick={handleNext} fullWidth>
          {isLast ? t('exercises.learnWords.startExercises') : t('exercises.learnWords.next')}
        </Button>
      </Box>
    </Container>
  );
}
