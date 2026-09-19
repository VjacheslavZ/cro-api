import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictionaryWord } from '@cro/shared';
import {
  GraduationCapIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
  Volume2Icon,
} from 'lucide-react';
import { cn } from 'cn';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

import { speakWord } from '../../shared/lib/speech';

interface WordRowProps {
  word: DictionaryWord;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (word: DictionaryWord) => void;
  onDelete: (word: DictionaryWord) => void;
  onMarkLearned: (word: DictionaryWord) => void;
  onResetProgress: (word: DictionaryWord) => void;
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

      {/* Word + translation */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{word.wordHr}</p>
        <p className="truncate text-xs text-muted-foreground">{word.translation}</p>
      </div>

      {/* Collection */}
      <div className="w-35 shrink-0">
        <p className="truncate text-[0.8rem] text-muted-foreground">{word.collectionName || '—'}</p>
      </div>

      {/* Progress */}
      <div className="flex w-38 shrink-0 items-center gap-2">
        {word.isLearned ? (
          <Badge variant="outline" className="border-success text-[0.7rem] text-success">
            {t('exercises.learnWords.learned')}
          </Badge>
        ) : (
          <>
            <Progress
              value={word.progressPercent}
              aria-label={t('dictionary.progress')}
              className="flex-1 **:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-track]:h-1.5"
            />
            <span className="min-w-8 text-right text-xs text-muted-foreground tabular-nums">
              {word.progressPercent}%
            </span>
          </>
        )}
      </div>

      {/* Actions: MarkLearned → ResetProgress → Edit → Listen → Delete */}
      <div className="flex shrink-0 items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onMarkLearned(word)}
          aria-label={t('dictionary.markLearned')}
          title={t('dictionary.markLearned')}
          className={cn(word.isLearned && 'invisible')}
        >
          <GraduationCapIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onResetProgress(word)}
          aria-label={t('dictionary.resetProgress')}
          title={t('dictionary.resetProgress')}
          className={cn(word.progressPercent === 0 && 'invisible')}
        >
          <RefreshCwIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(word)}
          aria-label={t('dictionary.editWordModal.title')}
        >
          <PencilIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => speakWord(word.wordHr)}
          aria-label={t('dictionary.listen')}
        >
          <Volume2Icon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(word)}
          aria-label={t('dictionary.delete')}
          className="text-destructive hover:text-destructive"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
});
