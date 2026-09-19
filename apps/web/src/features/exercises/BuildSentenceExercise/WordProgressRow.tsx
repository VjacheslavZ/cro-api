import { useTranslation } from 'react-i18next';
import { XIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface SortedWord {
  wordHr: string;
}

interface Props {
  phase: 'selecting' | 'correct' | 'incorrect';
  selectedWords: string[];
  sortedWords: SortedWord[];
  onUndo?: () => void;
}

export function WordProgressRow({ phase, selectedWords, sortedWords, onUndo }: Props) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex min-h-10 flex-wrap gap-2 rounded-lg border border-dashed bg-muted/50 p-3">
      {phase === 'selecting' &&
        selectedWords.map((word, idx) => {
          const canUndo = idx === selectedWords.length - 1 && Boolean(onUndo);
          return (
            <Badge key={idx} variant="outline" className="h-6 bg-info-muted text-sm">
              {word}
              {canUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  aria-label={t('common.undo')}
                  className="-mr-1 ml-0.5 rounded-full p-0.5 hover:bg-info-border"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </Badge>
          );
        })}

      {phase !== 'selecting' &&
        sortedWords.map((correctWord, idx) => {
          const chosen = selectedWords[idx];
          const isWrong = chosen !== correctWord.wordHr;
          return (
            <div key={idx} className="flex flex-col items-center">
              {isWrong && (
                <span className="text-xs leading-tight font-semibold text-success">
                  {correctWord.wordHr}
                </span>
              )}
              <Badge
                variant="outline"
                className={
                  isWrong
                    ? 'h-6 border-transparent bg-destructive-muted text-sm text-destructive-muted-foreground line-through'
                    : 'h-6 border-transparent bg-success-muted text-sm text-success-muted-foreground'
                }
              >
                {chosen}
              </Badge>
            </div>
          );
        })}
    </div>
  );
}
