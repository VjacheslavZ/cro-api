import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress, Skeleton, Checkbox, Alert } from '@mui/material';
import { LibraryBooks as LibraryBooksIcon } from '@mui/icons-material';
import type { DictionaryWord } from '@cro/shared';

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

const COLUMN_HEADER_SX = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'text.secondary',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
};

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              px: 2,
              py: 1.5,
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 1.5,
            }}
          >
            <Skeleton width="40%" height={20} />
            <Skeleton width="25%" height={16} sx={{ mt: 0.5 }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Box>
    );
  }

  if (words.length === 0) {
    return (
      <Box
        sx={{
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 2,
          py: 8,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'grey.100',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <LibraryBooksIcon sx={{ fontSize: 32, color: 'grey.400' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
          {t('dictionary.noWords')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Column headers — outside the scroll container so they stay fixed */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1.25,
          bgcolor: 'grey.50',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 1.5,
          gap: 1,
          mb: 1,
        }}
      >
        <Checkbox
          checked={allSelected}
          onChange={onSelectAll}
          size="small"
          sx={{ p: 0.5, flexShrink: 0 }}
          aria-label="Select all"
        />
        <Typography sx={{ ...COLUMN_HEADER_SX, flex: 1 }}>{t('dictionary.word')}</Typography>
        <Typography sx={{ ...COLUMN_HEADER_SX, width: 140 }}>
          {t('dictionary.collection')}
        </Typography>
        <Typography sx={{ ...COLUMN_HEADER_SX, width: 150 }}>{t('dictionary.progress')}</Typography>
        <Box sx={{ width: 164, flexShrink: 0 }} />
      </Box>

      {/* Fixed-height scroll container — page height never changes as pages load */}
      <Box
        ref={scrollContainerRef}
        sx={{
          height: 'calc(100vh - 450px)',
          minHeight: 300,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Virtual spacer — as tall as all rows combined */}
        <Box sx={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualItems.map((virtualItem) => {
            const word = words[virtualItem.index];
            return (
              <Box
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  pb: `${ROW_GAP}px`,
                }}
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
              </Box>
            );
          })}
        </Box>

        {isFetchingNextPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
