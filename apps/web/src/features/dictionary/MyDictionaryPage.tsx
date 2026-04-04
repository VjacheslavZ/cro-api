import { useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, FitnessCenter } from '@mui/icons-material';
import type { DictionaryWord } from '@cro/shared';

import {
  useDictionaryWords,
  useDeleteWord,
  useBatchAssignCollection,
  useDictionaryCollections,
  useStartDictionaryPractice,
} from '../../api/dictionary';
import { WordRow } from './WordRow';
import { AddWordModal } from './AddWordModal';

export function MyDictionaryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionIdParam = searchParams.get('collectionId') ?? undefined;

  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignCollectionId, setAssignCollectionId] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useDictionaryWords({ search: search || undefined, collectionId: collectionIdParam });
  const deleteWord = useDeleteWord();
  const batchAssign = useBatchAssignCollection();
  const { data: collections = [] } = useDictionaryCollections();
  const startPractice = useStartDictionaryPractice();

  const words = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    await deleteWord.mutateAsync(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  const handleStartPractice = async () => {
    try {
      const result = await startPractice.mutateAsync({
        collectionId: collectionIdParam,
      });
      navigate(`/dictionary/practice/${result.sessionId}`, {
        state: {
          items: result.items,
          totalQuestions: result.totalQuestions,
        },
      });
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('dictionary.title')}
      </Typography>

      {/* Top bar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={t('dictionary.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddModalOpen(true)}>
          {t('dictionary.addWord')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<FitnessCenter />}
          onClick={handleStartPractice}
          disabled={startPractice.isPending || words.length === 0}
        >
          {t('dictionary.practice.start')}
        </Button>
      </Box>

      {/* Batch actions */}
      {selectedIds.size > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('dictionary.selected', { count: selectedIds.size })}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t('dictionary.assignCollection')}</InputLabel>
            <Select
              value={assignCollectionId}
              onChange={(e) => setAssignCollectionId(e.target.value)}
              label={t('dictionary.assignCollection')}
            >
              <MenuItem value="">{t('dictionary.unassign')}</MenuItem>
              {collections.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button size="small" variant="outlined" onClick={handleBatchAssign}>
            {t('dictionary.assignCollection')}
          </Button>
        </Box>
      )}

      {/* Error states */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('common.error')}
        </Alert>
      )}
      {startPractice.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('dictionary.practice.noWords')}
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && words.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {t('dictionary.noWords')}
        </Typography>
      )}

      {/* Word list */}
      {words.map((word: DictionaryWord) => (
        <WordRow
          key={word.id}
          word={word}
          selected={selectedIds.has(word.id)}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {isFetchingNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Add Word Modal */}
      <AddWordModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        initialWord={search}
        collections={collections}
      />
    </Container>
  );
}
