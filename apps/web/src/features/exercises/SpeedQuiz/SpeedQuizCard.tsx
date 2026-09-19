import { useTranslation } from 'react-i18next';
import type { DictionaryPracticeItem } from '@cro/shared';
import { cn } from 'cn';

import { Button } from '@/components/ui/button';

import type { Phase } from './useSpeedQuiz';

interface SpeedQuizCardProps {
  item: DictionaryPracticeItem;
  options: string[];
  phase: Phase;
  selectedAnswer: string | null;
  timeLeft: number;
  /** Tailwind text-colour class for the countdown (see `useSpeedQuiz`). */
  timerClassName: string;
  onAnswer: (answer: string) => void;
}

export function SpeedQuizCard({
  item,
  options,
  phase,
  selectedAnswer,
  timeLeft,
  timerClassName,
  onAnswer,
}: SpeedQuizCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex justify-center">
        <span className={cn('text-3xl font-bold tabular-nums', timerClassName)}>{timeLeft}</span>
      </div>

      <div className="mb-6 text-center">
        <p className="mb-1 text-sm text-muted-foreground">
          {t('exercises.letterPick.instruction')}
        </p>
        <p className="text-3xl font-bold">{item.wordHr}</p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const isCorrectOpt = opt === item.translation;
          const isWrongSelected = phase === 'result' && opt === selectedAnswer && !isCorrectOpt;
          const isHighlightCorrect = phase === 'result' && isCorrectOpt;
          const result = isHighlightCorrect ? 'correct' : isWrongSelected ? 'wrong' : undefined;

          return (
            <Button
              key={opt}
              variant="outline"
              size="lg"
              disabled={phase === 'result'}
              onClick={() => onAnswer(opt)}
              data-result={result}
              className={cn(
                'h-12 w-full justify-start text-left text-base disabled:opacity-100',
                result === 'correct' &&
                  'border-success bg-success-muted text-success-muted-foreground',
                result === 'wrong' &&
                  'border-destructive-border bg-destructive-muted text-destructive-muted-foreground',
                !result && 'disabled:opacity-50',
              )}
            >
              {opt}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
