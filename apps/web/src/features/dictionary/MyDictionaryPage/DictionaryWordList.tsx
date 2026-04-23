import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress, Skeleton, Checkbox, Alert } from '@mui/material';
import { LibraryBooks as LibraryBooksIcon } from '@mui/icons-material';
import type { DictionaryWord } from '@cro/shared';

import { WordRow } from '../WordRow.tsx';

/**
 * Scrollable word list for the My Dictionary page with infinite scroll.
 *
 * Used in: MyDictionaryPage.
 *
 * Handles loading, error, and empty states via QueryState. Renders one
 * WordRow per word and attaches an IntersectionObserver sentinel at the
 * bottom to trigger `onFetchNextPage` when the user scrolls to the end.
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

  const observerRef = useRef<IntersectionObserver>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onFetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, onFetchNextPage],
  );

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
    <>
      {/* Column headers */}
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

      {/* Word cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {words.map((word) => (
          <WordRow
            key={word.id}
            word={word}
            selected={selectedIds.has(word.id)}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkLearned={onMarkLearned}
            onResetProgress={onResetProgress}
          />
        ))}

        <div ref={sentinelRef} style={{ height: 1 }} />

        {isFetchingNextPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </>
  );
}
