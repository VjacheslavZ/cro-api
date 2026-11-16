import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictionaryWord } from '@cro/shared';
import {
  EllipsisVerticalIcon,
  GraduationCapIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
  Volume2Icon,
} from 'lucide-react';
import { cn } from 'cn';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { speakWord } from '../../shared/lib/speech';

export interface WordActionHandlers {
  onEdit: (word: DictionaryWord) => void;
  onDelete: (word: DictionaryWord) => void;
  onMarkLearned: (word: DictionaryWord) => void;
  onResetProgress: (word: DictionaryWord) => void;
}

interface WordActionButtonsProps extends WordActionHandlers {
  word: DictionaryWord;
  /**
   * `invisible` keeps an unavailable action's slot so the inline buttons line up across rows;
   * `hidden` drops it, for the popover.
   */
  unavailable: 'invisible' | 'hidden';
  /** Called after an action that changes the word or opens a dialog (not after Listen). */
  onAction?: () => void;
}

/** The five word actions, in order: MarkLearned → ResetProgress → Edit → Listen → Delete. */
export function WordActionButtons({
  word,
  unavailable,
  onAction,
  onEdit,
  onDelete,
  onMarkLearned,
  onResetProgress,
}: WordActionButtonsProps) {
  const { t } = useTranslation();
  const run = (handler: (word: DictionaryWord) => void) => () => {
    handler(word);
    onAction?.();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={run(onMarkLearned)}
        aria-label={t('dictionary.markLearned')}
        title={t('dictionary.markLearned')}
        className={cn(word.isLearned && unavailable)}
      >
        <GraduationCapIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={run(onResetProgress)}
        aria-label={t('dictionary.resetProgress')}
        title={t('dictionary.resetProgress')}
        className={cn(word.progressPercent === 0 && unavailable)}
      >
        <RefreshCwIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={run(onEdit)}
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
        onClick={run(onDelete)}
        aria-label={t('dictionary.delete')}
        className="text-destructive hover:text-destructive"
      >
        <Trash2Icon />
      </Button>
    </>
  );
}

interface WordActionsMenuProps extends WordActionHandlers {
  word: DictionaryWord;
  className?: string;
}

/**
 * Narrow-screen replacement for the inline buttons: a "more" button that opens the same actions
 * in a popover to its left. Closes after any action except Listen. The popover content is only
 * mounted while open, so virtualized rows stay cheap.
 */
export function WordActionsMenu({ className, ...props }: WordActionsMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon-sm" className={cn('shrink-0', className)} />}
        aria-label={t('dictionary.actions')}
      >
        <EllipsisVerticalIcon />
      </PopoverTrigger>
      <PopoverContent side="left" className="w-auto flex-row gap-0 p-1">
        <WordActionButtons {...props} unavailable="hidden" onAction={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
