/**
 * @module DictionaryReviewExercise
 * @description FSRS revision card: shows a Croatian word, user taps to reveal the
 * translation, then self-reports recall quality via Again/Hard/Good/Easy, each
 * labeled with the predicted next-review interval computed by the backend scheduler.
 * @usedBy DictionaryReviewPage
 */
import { useTranslation } from 'react-i18next';
import { Typography, Button, Card, CardActionArea, Box } from '@mui/material';
import { FsrsRating } from '@cro/shared';
import type { DictionaryReviewItem, DictionaryReviewInterval } from '@cro/shared';

import { useSpeech } from '../../../shared/hooks/useSpeech.ts';

interface DictionaryReviewExerciseProps {
  item: DictionaryReviewItem;
  revealed: boolean;
  onReveal: () => void;
  onAnswer: (answer: { wordId: string; rating: FsrsRating }) => void;
}

const RATINGS: {
  rating: FsrsRating;
  labelKey: string;
  intervalKey: keyof DictionaryReviewInterval;
  color: 'error' | 'warning' | 'primary' | 'success';
}[] = [
  {
    rating: FsrsRating.AGAIN,
    labelKey: 'dictionary.review.again',
    intervalKey: 'again',
    color: 'error',
  },
  {
    rating: FsrsRating.HARD,
    labelKey: 'dictionary.review.hard',
    intervalKey: 'hard',
    color: 'warning',
  },
  {
    rating: FsrsRating.GOOD,
    labelKey: 'dictionary.review.good',
    intervalKey: 'good',
    color: 'primary',
  },
  {
    rating: FsrsRating.EASY,
    labelKey: 'dictionary.review.easy',
    intervalKey: 'easy',
    color: 'success',
  },
];

function formatInterval(t: (key: string, opts?: object) => string, days: number): string {
  if (days < 1) return t('dictionary.review.intervalMinute');
  return t('dictionary.review.intervalDay', { count: Math.round(days) });
}

/**
 * Renders a tap-to-reveal revision card with a 4-tier recall self-report.
 * @param props.item - The due DictionaryReviewItem (word, translation, predicted intervals)
 * @param props.revealed - Whether the translation has been revealed for this item
 * @param props.onReveal - Called when the user taps the card to reveal the translation
 * @param props.onAnswer - Called with `{ wordId, rating }` when the user rates recall
 */
export function DictionaryReviewExercise({
  item,
  revealed,
  onReveal,
  onAnswer,
}: DictionaryReviewExerciseProps) {
  const { t } = useTranslation();
  const { speak } = useSpeech();

  const handleReveal = () => {
    onReveal();
    speak(item.wordHr);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('dictionary.review.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('dictionary.review.instruction')}
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
          onClick={handleReveal}
          disabled={revealed}
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
            {item.wordHr}
          </Typography>

          {revealed ? (
            <Typography variant="h5" color="primary" sx={{ mt: 2, textAlign: 'center' }}>
              {item.translation}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('dictionary.review.tapToReveal')}
            </Typography>
          )}
        </CardActionArea>
      </Card>

      {revealed && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
          }}
        >
          {RATINGS.map(({ rating, labelKey, intervalKey, color }) => (
            <Button
              key={rating}
              variant="contained"
              color={color}
              size="large"
              onClick={() => onAnswer({ wordId: item.wordId, rating })}
              sx={{ display: 'flex', flexDirection: 'column', py: 1.5, lineHeight: 1.3 }}
            >
              <Typography variant="button">{t(labelKey)}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'none' }}>
                {formatInterval(t, item.intervals[intervalKey])}
              </Typography>
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}
