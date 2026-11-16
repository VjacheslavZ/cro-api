import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictionaryWord } from '@cro/shared';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

import { WordActionButtons, WordActionsMenu, type WordActionHandlers } from './WordActions';

interface WordRowProps extends WordActionHandlers {
  word: DictionaryWord;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}

/**
 * Memoized: DictionaryWordList re-renders on every scroll tick (virtualizer),
 * so rows must skip re-rendering when their props are unchanged.
 */
export const WordRow = memo(function WordRow({
  word,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onMarkLearned,
  onResetProgress,
}: WordRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50">
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelect(word.id, checked === true)}
        aria-label={word.wordHr}
        className="shrink-0"
      />

      {/* Word + translation; below md also the collection, whose column is hidden there */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{word.wordHr}</p>
        <p className="truncate text-xs text-muted-foreground">{word.translation}</p>
        {word.collectionName && (
          <p className="truncate text-[0.7rem] text-muted-foreground md:hidden">
            {word.collectionName}
          </p>
        )}
      </div>

      {/* Collection — from md up; below it the word column needs the room */}
      <div className="hidden w-35 shrink-0 md:block">
        <p className="truncate text-[0.8rem] text-muted-foreground">{word.collectionName || '—'}</p>
      </div>

      {/* Progress — below md only the percentage (the bar takes too much room); width matches the header column */}
      <div className="flex w-18 shrink-0 items-center gap-2 md:w-38">
        {word.isLearned ? (
          <Badge variant="outline" className="border-success text-[0.7rem] text-success">
            {t('exercises.learnWords.learned')}
          </Badge>
        ) : (
          <>
            <Progress
              value={word.progressPercent}
              aria-label={t('dictionary.progress')}
              className="flex-1 **:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-track]:h-1.5 max-md:hidden"
            />
            <span className="min-w-8 text-xs text-muted-foreground tabular-nums md:text-right">
              {word.progressPercent}%
            </span>
          </>
        )}
      </div>

      {/* Actions — inline from 650px; below it one "more" button opens them in a popover */}
      <div className="hidden shrink-0 items-center actions:flex">
        <WordActionButtons
          word={word}
          unavailable="invisible"
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkLearned={onMarkLearned}
          onResetProgress={onResetProgress}
        />
      </div>
      <WordActionsMenu
        word={word}
        className="actions:hidden"
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkLearned={onMarkLearned}
        onResetProgress={onResetProgress}
      />
    </div>
  );
});
