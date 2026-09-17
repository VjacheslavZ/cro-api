import type { ComponentProps } from 'react';
import { cn } from 'cn';

import { Button } from '@/components/ui/button';

/** Full-width dark "Check" / "Next" button used at the bottom of exercise cards. */
export function ExerciseActionButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      size="lg"
      className={cn(
        'h-14 w-full bg-foreground text-base font-semibold text-background hover:bg-foreground/90 disabled:bg-foreground/10 disabled:text-foreground/30 disabled:opacity-100',
        className,
      )}
      {...props}
    />
  );
}
