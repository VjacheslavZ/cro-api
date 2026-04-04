import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Card, CardActionArea, Box } from '@mui/material';
import type { FlashcardItem } from '@cro/shared';

import { getTranslation } from '../../shared/lib/content-utils';
import { useAppSelector } from '../../store';

interface FlashcardExerciseProps {
  item: FlashcardItem;
  onAnswer: (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => void;
  isLast: boolean;
}

export function FlashcardExercise({ item, onAnswer, isLast: _isLast }: FlashcardExerciseProps) {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const [flipped, setFlipped] = useState(false);

  const handleAnswer = (knew: boolean) => {
    onAnswer({
      itemId: item.id,
      givenAnswer: knew ? 'KNOWN' : 'UNKNOWN',
      isCorrect: knew,
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('exercises.flashcards.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('exercises.flashcards.instruction')}
      </Typography>

      <Card
        variant="outlined"
        sx={{
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <CardActionArea
          onClick={() => setFlipped(true)}
          sx={{
            height: '100%',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Typography variant="h4" sx={{ textAlign: 'center' }}>
            {item.frontText}
          </Typography>

          {flipped ? (
            <Typography variant="h5" color="primary" sx={{ mt: 2, textAlign: 'center' }}>
              {getTranslation(item, user?.nativeLanguage ?? null)}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('exercises.flashcards.tapToFlip')}
            </Typography>
          )}
        </CardActionArea>
      </Card>

      {flipped && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" color="error" onClick={() => handleAnswer(false)} size="large">
            {t('exercises.flashcards.didNotKnow')}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleAnswer(true)}
            size="large"
          >
            {t('exercises.flashcards.knew')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
