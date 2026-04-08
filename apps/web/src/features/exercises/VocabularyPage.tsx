import { useState } from 'react';
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
import { Translate, TextFields, GridOn, HearingOutlined } from '@mui/icons-material';

import { useStartDictionaryPractice } from '../../api/dictionary';

type ExerciseDirection = 'word-to-translate' | 'translate-to-word' | 'letter-pick' | 'matching';

const SESSION_WORD_COUNT = 10;

export function VocabularyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const startPractice = useStartDictionaryPractice();
  const [pendingDirection, setPendingDirection] = useState<ExerciseDirection | null>(null);

  const handleStart = async (direction: ExerciseDirection) => {
    setPendingDirection(direction);
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
    } finally {
      setPendingDirection(null);
    }
  };

  const exercises: {
    direction: ExerciseDirection;
    icon: React.ReactNode;
    titleKey: string;
    descKey: string;
  }[] = [
    {
      direction: 'word-to-translate',
      icon: <Translate color="primary" />,
      titleKey: 'exercises.vocabulary.wordToTranslate',
      descKey: 'exercises.vocabulary.wordToTranslateDesc',
    },
    {
      direction: 'translate-to-word',
      icon: <TextFields color="primary" />,
      titleKey: 'exercises.vocabulary.translateToWord',
      descKey: 'exercises.vocabulary.translateToWordDesc',
    },
    {
      direction: 'letter-pick',
      icon: <GridOn color="primary" />,
      titleKey: 'exercises.vocabulary.letterPick',
      descKey: 'exercises.vocabulary.letterPickDesc',
    },
    {
      direction: 'matching',
      icon: <HearingOutlined color="primary" />,
      titleKey: 'exercises.vocabulary.matching',
      descKey: 'exercises.vocabulary.matchingDesc',
    },
  ];

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
        {exercises.map(({ direction, icon, titleKey, descKey }) => {
          const isLoading = pendingDirection === direction;
          return (
            <Card key={direction} variant="outlined">
              <CardActionArea
                onClick={() => handleStart(direction)}
                disabled={pendingDirection !== null}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isLoading ? <CircularProgress size={24} /> : icon}
                  <Box>
                    <Typography variant="h6">{t(titleKey)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(descKey)}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Container>
  );
}
