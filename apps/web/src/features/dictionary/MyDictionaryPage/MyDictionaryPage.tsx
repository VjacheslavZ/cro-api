import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography } from '@mui/material';
import type { DictionaryWord } from '@cro/shared';

import {
  useDictionaryWords,
  useDeleteWord,
  useMarkWordAsLearned,
  useResetWordProgress,
  useBatchAssignCollection,
  useDictionaryCollections,
  type DictionaryWordSort,
} from '../../../api/dictionary.ts';
import { AddWordModal } from '../AddWordModal/AddWordModal.tsx';
import { EditWordModal } from '../EditWordModal.tsx';
import { DictionaryTopBar } from './DictionaryTopBar.tsx';
import { DictionaryBatchActions } from './DictionaryBatchActions.tsx';
import { DictionaryWordList } from './DictionaryWordList.tsx';
import { DeleteWordDialog } from './DeleteWordDialog.tsx';

/**
 * Route: /dictionary/my (supports ?collectionId=<id> filter)
 *
 * Main personal dictionary page. Orchestrates all dictionary state and
 * delegates rendering to focused sub-components:
 * - DictionaryTopBar — search input, Add Word, and Practice buttons
 * - DictionaryBatchActions — collection assignment for selected words
 * - DictionaryWordList — paginated word list with infinite scroll
 * - AddWordModal, EditWordModal, DeleteWordDialog — CRUD dialogs
 */
export function MyDictionaryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionIdParam = searchParams.get('collectionId') ?? undefined;

  const [search, setSearch] = useState('');
  const [hideLearned, setHideLearned] = useState(false);
  const [sort, setSort] = useState<DictionaryWordSort>('newest');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<DictionaryWord | null>(null);
  const [deletingWord, setDeletingWord] = useState<DictionaryWord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignCollectionId, setAssignCollectionId] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useDictionaryWords({
      search: search || undefined,
      collectionId: collectionIdParam,
      excludeLearned: hideLearned || undefined,
      sort,
    });
  const deleteWord = useDeleteWord();
  const markLearned = useMarkWordAsLearned();
  const resetProgress = useResetWordProgress();
  const batchAssign = useBatchAssignCollection();
  const { data: collections = [] } = useDictionaryCollections();

  const words = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const allSelected = words.length > 0 && selectedIds.size === words.length;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(words.map((w) => w.id)));
    }
  }, [allSelected, words]);

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingWord) return;
    await deleteWord.mutateAsync(deletingWord.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deletingWord.id);
      return next;
    });
    setDeletingWord(null);
  };

  const handleBatchAssign = async () => {
    if (selectedIds.size === 0) return;
    await batchAssign.mutateAsync({
      wordIds: Array.from(selectedIds),
      collectionId: assignCollectionId || null,
    });
    setSelectedIds(new Set());
    setAssignCollectionId('');
  };

  const handleMarkLearned = (word: DictionaryWord) => markLearned.mutate(word.id);
  const handleResetProgress = (word: DictionaryWord) => resetProgress.mutate(word.id);

  const handleStartPractice = () => {
    const url = collectionIdParam
      ? `/exercises/vocabulary/learn?collectionId=${collectionIdParam}`
      : '/exercises/vocabulary/learn';
    navigate(url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827' }}>
          {t('dictionary.title')}
        </Typography>
        {!isLoading && (
          <Box
            sx={{
              px: 1.5,
              py: 0.25,
              bgcolor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              borderRadius: '999px',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {total}
          </Box>
        )}
      </Box>

      <DictionaryTopBar
        search={search}
        onSearchChange={setSearch}
        onSearchEnter={() => setAddModalOpen(true)}
        onAddWord={() => setAddModalOpen(true)}
        onStartPractice={handleStartPractice}
        practiceDisabled={words.length === 0}
        hideLearned={hideLearned}
        onHideLearnedChange={setHideLearned}
        sort={sort}
        onSortChange={setSort}
      />

      <DictionaryBatchActions
        selectedCount={selectedIds.size}
        assignCollectionId={assignCollectionId}
        collections={collections}
        onAssignCollectionChange={setAssignCollectionId}
        onAssign={handleBatchAssign}
        onCancel={() => setSelectedIds(new Set())}
      />

      <DictionaryWordList
        words={words}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        selectedIds={selectedIds}
        allSelected={allSelected}
        onFetchNextPage={fetchNextPage}
        onSelectAll={handleSelectAll}
        onSelect={handleSelect}
        onEdit={setEditingWord}
        onDelete={setDeletingWord}
        onMarkLearned={handleMarkLearned}
        onResetProgress={handleResetProgress}
      />

      <AddWordModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => setSearch('')}
        initialWord={search}
        collections={collections}
      />

      <EditWordModal
        open={editingWord !== null}
        word={editingWord}
        onClose={() => setEditingWord(null)}
      />

      <DeleteWordDialog
        word={deletingWord}
        isPending={deleteWord.isPending}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingWord(null)}
      />
    </Container>
  );
}
