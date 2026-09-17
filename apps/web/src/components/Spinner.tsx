import { Loader2Icon } from 'lucide-react';
import { cn } from 'cn';

interface SpinnerProps {
  className?: string;
}

/** Replacement for MUI `CircularProgress`: a spinning lucide loader in the current text colour. */
export function Spinner({ className }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-8 animate-spin text-primary', className)}
    />
  );
}
