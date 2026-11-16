import { FlameIcon, StarIcon } from 'lucide-react';
import { cn } from 'cn';

interface StatPillsProps {
  xp: number;
  streak: number;
  className?: string;
}

/** XP and streak counters, shown in the header and, on narrow screens, in MobileNav. */
export function StatPills({ xp, streak, className }: StatPillsProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <span className="mx-1 inline-flex items-center gap-1.5 rounded-full border border-xp-border bg-xp-muted px-3 py-1.5 text-sm font-medium text-xp-foreground">
        <StarIcon className="size-4 text-xp" />
        {xp}
      </span>
      <span className="mx-1 inline-flex items-center gap-1.5 rounded-full border border-streak-border bg-streak-muted px-3 py-1.5 text-sm font-medium text-streak-foreground">
        <FlameIcon className="size-4 text-streak" />
        {streak}
      </span>
    </div>
  );
}
