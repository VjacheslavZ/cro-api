/**
 * @module DictionaryReviewExercise
 * @description FSRS revision card: shows a Croatian word, user taps to reveal the
 * translation, then self-reports recall quality via Again/Hard/Good/Easy, each
 * labeled with the predicted next-review interval computed by the backend scheduler.
 * @usedBy DictionaryReviewPage
 */
import { useTranslation } from 'react-i18next';
import { FsrsRating } from '@cro/shared';
import type { DictionaryReviewItem, DictionaryReviewInterval } from '@cro/shared';

import { Button } from '@/components/ui/button';

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
  /** Button colour classes per FSRS rating. */
  className: string;
}[] = [
  {
    rating: FsrsRating.AGAIN,
    labelKey: 'dictionary.review.again',
    intervalKey: 'again',
    className: 'bg-destructive text-white hover:bg-destructive/90',
  },
  {
    rating: FsrsRating.HARD,
    labelKey: 'dictionary.review.hard',
    intervalKey: 'hard',
    className: 'bg-amber-500 text-white hover:bg-amber-500/90',
  },
  {
    rating: FsrsRating.GOOD,
    labelKey: 'dictionary.review.good',
    intervalKey: 'good',
    className: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  {
    rating: FsrsRating.EASY,
    labelKey: 'dictionary.review.easy',
    intervalKey: 'easy',
    className: 'bg-success text-success-foreground hover:bg-success/90',
  },
];

function formatInterval(
  t: (key: string, opts?: Record<string, unknown>) => string,
  days: number,
): string {
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
    <div>
      <h2 className="mb-1 text-lg font-medium">{t('dictionary.review.title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t('dictionary.review.instruction')}</p>

      <button
        type="button"
        onClick={handleReveal}
        disabled={revealed}
        className="mb-6 flex min-h-50 w-full flex-col items-center justify-center rounded-xl border bg-card p-6 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:hover:bg-muted/50"
      >
        <span className="text-3xl font-semibold">{item.wordHr}</span>

        {revealed ? (
          <span className="mt-4 text-2xl text-primary">{item.translation}</span>
        ) : (
          <span className="mt-4 text-sm text-muted-foreground">
            {t('dictionary.review.tapToReveal')}
          </span>
        )}
      </button>

      {revealed && (
        <div className="grid grid-cols-2 gap-4">
          {RATINGS.map(({ rating, labelKey, intervalKey, className }) => (
            <Button
              key={rating}
              size="lg"
              className={`h-auto flex-col gap-0 py-3 leading-snug ${className}`}
              onClick={() => onAnswer({ wordId: item.wordId, rating })}
            >
              <span className="text-sm font-semibold uppercase">{t(labelKey)}</span>
              <span className="text-xs font-normal opacity-85">
                {formatInterval(t, item.intervals[intervalKey])}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
