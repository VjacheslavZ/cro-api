/**
 * @module FlashcardExercise
 * @description Flashcard exercise: shows a Croatian word, user taps to flip and see the
 * translation, then self-reports whether they knew it. Speaks the word on flip.
 * isCorrect = true when user clicks "I knew it", false when "I didn't know".
 * @usedBy SessionPage
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FlashcardItem } from '@cro/shared';

import { Button } from '@/components/ui/button';

import { getTranslation } from '../../../shared/lib/content-utils.ts';
import { useAppSelector } from '../../../store';
import { useSpeech } from '../../../shared/hooks/useSpeech.ts';

interface FlashcardExerciseProps {
  item: FlashcardItem;
  onAnswer: (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => void;
  isLast: boolean;
}

/**
 * Renders a tap-to-flip flashcard with "I knew it" / "I didn't know" self-report buttons.
 * @param props.item - The FlashcardItem to display (frontText + translations)
 * @param props.onAnswer - Called with `{ itemId, givenAnswer: 'KNOWN'|'UNKNOWN', isCorrect }` on self-report
 * @param props.isLast - Whether this is the final item (currently unused but part of the shared contract)
 */
export function FlashcardExercise({ item, onAnswer, isLast: _isLast }: FlashcardExerciseProps) {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const { speak } = useSpeech();
  const [flipped, setFlipped] = useState(false);

  const handleAnswer = (knew: boolean) => {
    onAnswer({
      itemId: item.id,
      givenAnswer: knew ? 'KNOWN' : 'UNKNOWN',
      isCorrect: knew,
    });
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-medium">{t('exercises.flashcards.title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t('exercises.flashcards.instruction')}</p>

      <button
        type="button"
        onClick={() => {
          setFlipped(true);
          speak(item.frontText);
        }}
        className="mb-6 flex min-h-50 w-full flex-col items-center justify-center rounded-xl border bg-card p-6 text-center transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="text-3xl font-semibold">{item.frontText}</span>

        {flipped ? (
          <span className="mt-4 text-2xl text-primary">
            {getTranslation(item, user?.nativeLanguage ?? null)}
          </span>
        ) : (
          <span className="mt-4 text-sm text-muted-foreground">
            {t('exercises.flashcards.tapToFlip')}
          </span>
        )}
      </button>

      {flipped && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => handleAnswer(false)}
          >
            {t('exercises.flashcards.didNotKnow')}
          </Button>
          <Button
            size="lg"
            className="bg-success text-success-foreground hover:bg-success/90"
            onClick={() => handleAnswer(true)}
          >
            {t('exercises.flashcards.knew')}
          </Button>
        </div>
      )}
    </div>
  );
}
