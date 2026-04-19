import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography } from '@mui/material';
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
 *
 * Owns: search text, selected word IDs, open modal state, and the word to
 * delete/edit. All server state (words, collections) lives in TanStack Query.
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

  const handleMarkLearned = (word: DictionaryWord) => {
    markLearned.mutate(word.id);
  };

  const handleResetProgress = (word: DictionaryWord) => {
    resetProgress.mutate(word.id);
  };

  const handleStartPractice = () => {
    const url = collectionIdParam
      ? `/exercises/vocabulary/learn?collectionId=${collectionIdParam}`
      : '/exercises/vocabulary/learn';
    navigate(url);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('dictionary.title')}
        {!isLoading && (
          <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
            ({total})
          </Typography>
        )}
      </Typography>

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
      />

      <DictionaryWordList
        words={words}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        selectedIds={selectedIds}
        onFetchNextPage={fetchNextPage}
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
