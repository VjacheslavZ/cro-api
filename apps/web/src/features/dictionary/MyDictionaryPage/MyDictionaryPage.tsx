import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DictionaryWord } from '@cro/shared';

import { PageContainer } from '@/components/PageContainer';
import { Badge } from '@/components/ui/badge';
import {
  useDictionaryWords,
  useDictionaryCollections,
  type DictionaryWordSort,
} from '@/api/dictionary.ts';

import { AddWordModal } from '../AddWordModal/AddWordModal.tsx';
import { EditWordModal } from '../EditWordModal.tsx';
import { DictionaryTopBar } from './DictionaryTopBar.tsx';
import { DictionaryBatchActions } from './DictionaryBatchActions.tsx';
import { DictionaryWordList } from './DictionaryWordList.tsx';
import { DeleteWordDialog } from './DeleteWordDialog.tsx';
import { useWordSelection } from './useWordSelection.ts';

/**
 * Route: /dictionary/my (supports ?collectionId=<id> filter)
 *
 * Main personal dictionary page. Owns the list filters and which dialog is
 * open; everything else is delegated:
 * - DictionaryTopBar — search, sort, hide-learned, Add Word, Practice
 * - DictionaryBatchActions — assign selected words to a collection
 * - DictionaryWordList — virtualized list with infinite scroll
 * - AddWordModal, EditWordModal, DeleteWordDialog — CRUD dialogs
 */
export function MyDictionaryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionIdParam = searchParams.get('collectionId') ?? undefined;

  // List filters
  const [search, setSearch] = useState('');
  const [hideLearned, setHideLearned] = useState(false);
  const [sort, setSort] = useState<DictionaryWordSort>('newest');

  // Dialogs
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<DictionaryWord | null>(null);
  const [deletingWord, setDeletingWord] = useState<DictionaryWord | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useDictionaryWords({
      search: search || undefined,
      collectionId: collectionIdParam,
      excludeLearned: hideLearned || undefined,
      sort,
    });
  const collectionsQuery = useDictionaryCollections();
  // No default in the destructuring pattern: it makes React Compiler bail out of this component
  const collections = collectionsQuery.data ?? [];

  const words = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const selection = useWordSelection(words);

  const handleStartPractice = () => {
    const url = collectionIdParam
      ? `/exercises/vocabulary/learn?collectionId=${collectionIdParam}`
      : '/exercises/vocabulary/learn';
    navigate(url);
  };

  return (
    <PageContainer size="lg" className="relative py-2">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-foreground">{t('dictionary.title')}</h1>
        {!isLoading && (
          <Badge variant="outline" className="h-6 border-blue-200 bg-blue-50 text-sm text-blue-700">
            {total}
          </Badge>
        )}
      </div>

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
        selectedIds={selection.selectedIds}
        collections={collections}
        onDone={selection.clear}
      />

      <DictionaryWordList
        words={words}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        selectedIds={selection.selectedIds}
        allSelected={selection.allSelected}
        onFetchNextPage={fetchNextPage}
        onSelectAll={selection.toggleAll}
        onSelect={selection.select}
        onEdit={setEditingWord}
        onDelete={setDeletingWord}
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
        onDeleted={selection.remove}
        onClose={() => setDeletingWord(null)}
      />
    </PageContainer>
  );
}
