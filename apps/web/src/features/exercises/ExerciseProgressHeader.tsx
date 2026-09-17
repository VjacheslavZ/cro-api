import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, BookOpenIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ExerciseProgressHeaderProps {
  currentIndex: number;
  total: number;
  onStop: () => void;
  onShowRules?: () => void;
  /** Overrides the computed (currentIndex + 1) / total progress percentage */
  progressValue?: number;
}

export function ExerciseProgressHeader({
  currentIndex,
  total,
  onStop,
  onShowRules,
  progressValue,
}: ExerciseProgressHeaderProps) {
  const { t } = useTranslation();
  const progress = progressValue ?? ((currentIndex + 1) / total) * 100;

  return (
    <div className="mb-8 rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onStop}>
            <ArrowLeftIcon data-icon="inline-start" />
            {t('exercises.session.stop')}
          </Button>
          {onShowRules && (
            <Button size="sm" variant="ghost" onClick={onShowRules}>
              <BookOpenIcon data-icon="inline-start" />
              {t('exercises.rules.show')}
            </Button>
          )}
        </div>
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {currentIndex + 1} / {total}
        </span>
      </div>
      <Progress
        value={progress}
        aria-label={t('exercises.session.progress', { current: currentIndex + 1, total })}
        className="**:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-foreground **:data-[slot=progress-track]:h-2 **:data-[slot=progress-track]:bg-foreground/10"
      />
    </div>
  );
}
