/**
 * @module TypeTheAnswer
 * @description Tab content for managing Type the Answer exercise items within a topic. Fetches
 * items via ['type-the-answer-items', topicId] from GET /admin/topics/:id/singular-plural-items
 * (legacy path — TODO rename to /type-the-answer). saveMutation handles both add
 * (POST /admin/singular-plural-items) and edit (PATCH /admin/singular-plural-items/:id).
 * Uses useTablePagination for client-side pagination. Inline form is toggled by the "Add Item"
 * button; editing a row pre-populates the form via AddExerciseQuestion's useEffect reset.
 * @usedBy ExercisePage
 */
import { useState } from 'react';
import { Alert, Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../api/client.ts';
import { QueryState } from '../../../shared/components/QueryState';
import { useTablePagination } from '../../../shared/hooks/useTablePagination.tsx';
import {
  AddExerciseQuestion,
  type SingularPluralFormData,
  type SingularPluralItem,
} from './AddExerciseQuestion.tsx';
import { ContentTable } from './ContentTable.tsx';

/**
 * Renders the Type the Answer item list with inline add/edit form for a given topic.
 * @param topicId - The topic whose Type the Answer items are being managed.
 */
export function TypeTheAnswer({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SingularPluralItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const queryKey = ['type-the-answer-items', topicId];

  const {
    data: items,
    isLoading,
    error,
  } = useQuery<SingularPluralItem[]>({
    queryKey,
    queryFn: async () => {
      // TODO rename /singular-plural-items path to type-the-answer
      const { data } = await apiClient.get(`/admin/topics/${topicId}/singular-plural-items`);
      return data;
    },
  });

  const { paginatedItems, Pagination } = useTablePagination(items);

  const [serverError, setServerError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (data: SingularPluralFormData) => {
      if (editing) {
        // TODO rename /singular-plural-items path to type-the-answer
        await apiClient.patch(`/admin/singular-plural-items/${editing.id}`, data);
      } else {
        // TODO rename /singular-plural-items path to type-the-answer
        await apiClient.post('/admin/singular-plural-items', { ...data, topicId });
      }
    },
    onSuccess: () => {
      setServerError(null);
      queryClient.invalidateQueries({ queryKey });
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
      // TODO rename /singular-plural-items path to type-the-answer
      await apiClient.delete(`/admin/singular-plural-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const queryState = QueryState({ isLoading, error, errorMessage: 'Failed to load items' });
  if (queryState) return queryState;

  return (
    <Box>
      <Button
        startIcon={<AddIcon />}
        variant="outlined"
        sx={{ mb: 2 }}
        onClick={() => {
          setEditing(null);
          setShowForm(!showForm);
        }}
      >
        {showForm ? 'Cancel' : 'Add Item'}
      </Button>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setServerError(null)}>
          {serverError}
        </Alert>
      )}

      {showForm && (
        <AddExerciseQuestion
          topicId={topicId}
          editing={editing}
          isPending={saveMutation.isPending}
          onSubmit={(d) => saveMutation.mutate(d)}
        />
      )}

      <ContentTable
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
