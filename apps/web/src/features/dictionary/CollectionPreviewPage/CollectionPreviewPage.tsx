import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Checkbox,
} from '@mui/material';
import { ArrowBack, LibraryAdd } from '@mui/icons-material';
import type { PredefinedDictionaryWord } from '@cro/shared';

import { useAppSelector } from '../../../store';
import {
  useCollectionWords,
  useAddSet,
  useDictionaryCollections,
} from '../../../api/dictionary.ts';
import { QueryState } from '../../../shared/components/QueryState.tsx';

function getTranslation(word: PredefinedDictionaryWord, lang: string | null): string {
  if (lang === 'RU') return word.translationRu;
  if (lang === 'UK') return word.translationUk;
  return word.translationEn;
}

export function CollectionPreviewPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const nativeLanguage = useAppSelector((state) => state.auth.user?.nativeLanguage ?? null);

  const { data: words = [], isLoading, isError } = useCollectionWords(collectionId!);
  const { data: collections = [] } = useDictionaryCollections();
  const addSet = useAddSet();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const collection = collections.find((c) => c.id === collectionId);
  const allSelected = words.length > 0 && selectedIds.size === words.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(words.map((w) => w.id)));
    }
  };

  const handleAdd = () => {
    const wordIds = selectedIds.size === words.length ? undefined : Array.from(selectedIds);
    addSet.mutate(
      { collectionId: collectionId!, wordIds },
      {
        onSuccess: (result) => {
          setSnackbar(
            t('dictionary.collections.addSetSuccess', {
              added: result.addedCount,
              skipped: result.skippedCount,
            }),
          );
          setSelectedIds(new Set());
        },
      },
    );
  };

  const queryState = QueryState({ isLoading, isError });
  if (queryState) return queryState;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dictionary/recommended-word-sets')}
        sx={{ mb: 2 }}
      >
        {t('dictionary.collections.title')}
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">{collection?.name ?? ''}</Typography>
          {collection?.description && (
            <Typography variant="body2" color="text.secondary">
              {collection.description}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {t('dictionary.collections.wordsInSet', { count: words.length })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={addSet.isPending ? <CircularProgress size={16} /> : <LibraryAdd />}
          disabled={addSet.isPending || selectedIds.size === 0}
          onClick={handleAdd}
        >
          {t('dictionary.collections.addSelected', { count: selectedIds.size })}
        </Button>
      </Box>

      {words.length === 0 ? (
        <Alert severity="info">{t('dictionary.collections.noWords')}</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selectedIds.size > 0 && !allSelected}
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                <TableCell>{t('dictionary.word')}</TableCell>
                <TableCell>{t('dictionary.translation')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {words.map((word) => (
                <TableRow
                  key={word.id}
                  hover
                  selected={selectedIds.has(word.id)}
                  onClick={() => toggleSelect(word.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.has(word.id)} />
                  </TableCell>
                  <TableCell>{word.wordHr}</TableCell>
                  <TableCell>{getTranslation(word, nativeLanguage)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Container>
  );
}
