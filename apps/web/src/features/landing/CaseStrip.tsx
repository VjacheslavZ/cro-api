import { useTranslation } from 'react-i18next';
import { cn } from 'cn';

import { CASES, type CaseKey } from './drillItems';

interface CaseStripProps {
  /** Cases the visitor has answered correctly in the demo. */
  done: ReadonlySet<CaseKey>;
  /** Case currently being drilled, if any. */
  active: CaseKey | null;
}

/**
 * The seven Croatian cases drawn as a strip of chequered cells. The nominative
 * starts filled (it is the form you look up); the others fill in as the visitor
 * answers. Landing-only accent: the one place the red appears on the page.
 */
export function CaseStrip({ done, active }: CaseStripProps) {
  const { t } = useTranslation();

  return (
    <ol
      aria-label={t('landing.drill.casesLabel')}
      className="flex gap-1.5"
      data-testid="case-strip"
    >
      {CASES.map((c) => {
        const isBase = c === 'N';
        const isDone = isBase || done.has(c);
        const isActive = c === active;
        return (
          <li
            key={c}
            aria-current={isActive ? 'step' : undefined}
            data-state={isActive ? 'active' : isDone ? 'done' : 'pending'}
            className={cn(
              'flex size-9 items-center justify-center rounded-sm border font-display text-base font-medium transition-colors sm:size-10',
              isDone && 'border-red-600 bg-red-600 text-white dark:border-red-500 dark:bg-red-500',
              isBase && 'bg-red-600/85 dark:bg-red-500/85',
              !isDone && 'border-border text-muted-foreground',
              isActive &&
                'border-red-600 text-foreground ring-2 ring-red-600/25 dark:border-red-500',
            )}
            title={t(`landing.cases.${c}`)}
          >
            {c}
          </li>
        );
      })}
    </ol>
  );
}
