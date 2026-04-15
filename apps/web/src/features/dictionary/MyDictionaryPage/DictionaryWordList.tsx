import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress } from '@mui/material';
import type { DictionaryWord } from '@cro/shared';

import { QueryState } from '../../../shared/components/QueryState.tsx';
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
  /** Whether more pages are available for infinite scroll. */
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** IDs of words currently checked via the row checkbox. */
  selectedIds: Set<string>;
  /** Called by the IntersectionObserver when the sentinel enters the viewport. */
  onFetchNextPage: () => void;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (word: DictionaryWord) => void;
  onDelete: (word: DictionaryWord) => void;
}

export function DictionaryWordList({
  words,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  selectedIds,
  onFetchNextPage,
  onSelect,
  onEdit,
  onDelete,
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

  const queryState = QueryState({ isLoading, isError });
  if (queryState) return queryState;

  if (words.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        {t('dictionary.noWords')}
      </Typography>
    );
  }

  return (
    <>
      {words.map((word) => (
        <WordRow
          key={word.id}
          word={word}
          selected={selectedIds.has(word.id)}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      <div ref={sentinelRef} style={{ height: 1 }} />
      {isFetchingNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </>
  );
}
