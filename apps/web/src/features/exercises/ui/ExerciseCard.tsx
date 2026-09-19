import type { ComponentProps } from 'react';
import { cn } from 'cn';

type ExerciseCardStatus = 'idle' | 'success' | 'warning';

const statusRing: Record<ExerciseCardStatus, string> = {
  idle: 'shadow-[0_4px_24px_rgba(0,0,0,0.10)] dark:ring-1 dark:ring-border',
  success: 'shadow-[0_0_0_3px_var(--color-success),0_4px_24px_rgba(0,0,0,0.06)]',
  warning: 'shadow-[0_0_0_3px_var(--color-warning),0_4px_24px_rgba(0,0,0,0.06)]',
};

interface ExerciseCardProps extends ComponentProps<'div'> {
  /** Coloured ring once the item is complete (LetterPick, BuildSentence…). */
  status?: ExerciseCardStatus;
}

/** The white elevated card every exercise renders inside. */
export function ExerciseCard({ status = 'idle', className, ...props }: ExerciseCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-card p-6 transition-shadow duration-300 md:p-10',
        statusRing[status],
        className,
      )}
      {...props}
    />
  );
}
