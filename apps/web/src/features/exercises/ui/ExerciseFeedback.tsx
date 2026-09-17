import type { ReactNode } from 'react';
import { CircleCheckIcon, CircleXIcon } from 'lucide-react';
import { cn } from 'cn';

type FeedbackKind = 'correct' | 'incorrect' | 'warning';

const kindClass: Record<FeedbackKind, string> = {
  correct: 'text-success',
  incorrect: 'text-destructive',
  warning: 'text-amber-600',
};

interface ExerciseFeedbackProps {
  /** `null` renders the empty (fixed-height) slot so the layout never jumps. */
  kind: FeedbackKind | null;
  children?: ReactNode;
  className?: string;
}

/** Fixed-height feedback slot under an exercise: check / cross icon + message. */
export function ExerciseFeedback({ kind, children, className }: ExerciseFeedbackProps) {
  return (
    <div className={cn('mb-4 flex min-h-16 items-center justify-center', className)}>
      {kind && (
        <div className={cn('flex items-start gap-2', kindClass[kind])}>
          {kind === 'correct' ? (
            <CircleCheckIcon className="mt-0.5 size-7 shrink-0" />
          ) : (
            <CircleXIcon className="mt-0.5 size-7 shrink-0" />
          )}
          <span className={cn(kind === 'correct' ? 'text-lg font-semibold' : 'font-medium')}>
            {children}
          </span>
        </div>
      )}
    </div>
  );
}
