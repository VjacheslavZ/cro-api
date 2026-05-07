/**
 * @module CollectionWordsPage
 * @description Admin page for managing predefined words within a single dictionary collection.
 * Fetches words via ['admin-collection-words', collectionId] and supports add/edit/delete.
 * Both saveMutation and deleteMutation also invalidate ['admin-dictionary-collections'] so the
 * word count chip in CollectionsTable stays accurate. Uses useTablePagination for client-side
 * pagination; Pagination component is passed as a render prop to WordsTable.
 * @usedBy AdminRouter (/dictionary-collections/:collectionId/words)
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Typography } from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../api/client';
import { QueryState } from '../../../shared/components/QueryState';
import { useTablePagination } from '../../../shared/hooks/useTablePagination';
import { AddWordForm, type PredefinedWordFormData, type PredefinedWordItem } from './AddWordForm';
import { WordsTable } from './WordsTable';

/**
 * Renders the word list for a collection with inline add/edit form toggled by the "Add Word" button.
 * Editing a row sets the editing state and shows the form pre-populated via AddWordForm's useEffect.
 */
export function CollectionWordsPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PredefinedWordItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const queryKey = ['admin-collection-words', collectionId];

  const {
    data: words,
    isLoading,
    error,
  } = useQuery<PredefinedWordItem[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/dictionary-collections/${collectionId}/words`);
      return data;
    },
  });

  const { paginatedItems, Pagination } = useTablePagination(words);

  const saveMutation = useMutation({
    mutationFn: async (data: PredefinedWordFormData) => {
      if (editing) {
        await apiClient.patch(`/admin/dictionary-collections/words/${editing.id}`, data);
      } else {
        await apiClient.post(`/admin/dictionary-collections/${collectionId}/words`, data);
      }
    },
    onSuccess: () => {
      setServerError(null);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['admin-dictionary-collections'] });
      setEditing(null);
      setShowForm(false);
    },
    onError: (err: unknown) => {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        setServerError((err as { response: { data: { message: string } } }).response.data.message);
      } else {
        setServerError('An error occurred');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/dictionary-collections/words/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['admin-dictionary-collections'] });
    },
  });

  const queryState = QueryState({ isLoading, error, errorMessage: 'Failed to load words' });
  if (queryState) return queryState;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/dictionary-collections')}
        sx={{ mb: 2 }}
      >
        Back to Collections
      </Button>

      <Typography variant="h5" gutterBottom>
        Collection Words
      </Typography>

      <Button
        startIcon={<AddIcon />}
        variant="outlined"
        sx={{ mb: 2 }}
        onClick={() => {
          setEditing(null);
          setShowForm(!showForm);
        }}
      >
        {showForm ? 'Cancel' : 'Add Word'}
      </Button>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setServerError(null)}>
          {serverError}
        </Alert>
      )}

      {showForm && (
        <AddWordForm
          editing={editing}
          isPending={saveMutation.isPending}
          onSubmit={(d) => saveMutation.mutate(d)}
        />
      )}

      <WordsTable
        items={paginatedItems}
        onEdit={(item) => {
          setEditing(item);
          setShowForm(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        isDeletePending={deleteMutation.isPending}
        Pagination={Pagination}
      />
    </Box>
  );
}
