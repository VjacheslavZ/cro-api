import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import type { DictionaryWord } from '@cro/shared';
import { LibraryIcon } from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';
import { ErrorAlert } from '@/components/ErrorAlert';
import { Spinner } from '@/components/Spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

import { WordRow } from '../WordRow.tsx';

/**
 * Virtualized word list for the My Dictionary page.
 *
 * Renders only the rows currently in the viewport using @tanstack/react-virtual.
 * The scroll container has a fixed height so the page never grows when new pages
 * are loaded. Infinite scroll is triggered when the last visible item reaches
 * the end of the loaded word array.
 */
interface DictionaryWordListProps {
  words: DictionaryWord[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  selectedIds: Set<string>;
  allSelected: boolean;
  onFetchNextPage: () => void;
  onSelectAll: () => void;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (word: DictionaryWord) => void;
  onDelete: (word: DictionaryWord) => void;
  onMarkLearned: (word: DictionaryWord) => void;
  onResetProgress: (word: DictionaryWord) => void;
}

const ROW_GAP = 8;
const ESTIMATED_ROW_HEIGHT = 62;

const COLUMN_HEADER_CLASS =
  'text-[0.7rem] font-bold tracking-wider text-muted-foreground uppercase';

export function DictionaryWordList({
  words,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  selectedIds,
  allSelected,
  onFetchNextPage,
  onSelectAll,
  onSelect,
  onEdit,
  onDelete,
  onMarkLearned,
  onResetProgress,
}: DictionaryWordListProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: words.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT + ROW_GAP,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Trigger next page fetch when the last visible item reaches the end of loaded words
  useEffect(() => {
    const lastItem = virtualItems.at(-1);
    if (lastItem && lastItem.index >= words.length - 1 && hasNextPage && !isFetchingNextPage) {
      onFetchNextPage();
    }
  }, [virtualItems, words.length, hasNextPage, isFetchingNextPage, onFetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border px-4 py-3">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="mt-1 h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8">
        <ErrorAlert />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="rounded-xl border">
        <EmptyState icon={<LibraryIcon />} title={t('dictionary.noWords')} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Column headers — outside the scroll container so they stay fixed */}
      <div className="mb-2 flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2.5">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          className="shrink-0"
          aria-label="Select all"
        />
        <span className={`${COLUMN_HEADER_CLASS} flex-1`}>{t('dictionary.word')}</span>
        <span className={`${COLUMN_HEADER_CLASS} w-35`}>{t('dictionary.collection')}</span>
        <span className={`${COLUMN_HEADER_CLASS} w-38`}>{t('dictionary.progress')}</span>
        <div className="w-35 shrink-0" />
      </div>

      {/* Fixed-height scroll container — page height never changes as pages load */}
      <div
        ref={scrollContainerRef}
        className="h-[calc(100vh-450px)] min-h-75 overflow-x-hidden overflow-y-auto"
      >
        {/* Virtual spacer — as tall as all rows combined */}
        <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualItems.map((virtualItem) => {
            const word = words[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${virtualItem.start}px)`, paddingBottom: ROW_GAP }}
              >
                <WordRow
                  word={word}
                  selected={selectedIds.has(word.id)}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMarkLearned={onMarkLearned}
                  onResetProgress={onResetProgress}
                />
              </div>
            );
          })}
        </div>

        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Spinner className="size-6" />
          </div>
        )}
      </div>
    </div>
  );
}
