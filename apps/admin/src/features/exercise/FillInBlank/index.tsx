/**
 * @module FillInBlankTab
 * @description Tab content for managing Fill in the Blank exercise items within a topic. Fetches
 * items via ['fill-in-blank-items', topicId] from GET /admin/topics/:id/fill-in-blank-items.
 * saveMutation handles add (POST /admin/fill-in-blank-items) and edit
 * (PATCH /admin/fill-in-blank-items/:id). Uses useTablePagination for client-side pagination.
 * Inline form is toggled by the "Add Item" button; editing a row pre-populates the form via
 * AddExerciseQuestion's useEffect reset. sentenceHr must include a {{BLANK}} placeholder.
 * @usedBy ExercisePage
 */
import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../api/client.ts';
import { QueryState } from '../../../shared/components/QueryState';
import { useTablePagination } from '../../../shared/hooks/useTablePagination.tsx';
import {
  AddExerciseQuestion,
  type FillInBlankFormData,
  type FillInBlankItem,
} from './AddExerciseQuestion.tsx';
import { ContentTable } from './ContentTable.tsx';

/**
 * Renders the Fill in the Blank item list with inline add/edit form for a given topic.
 * @param topicId - The topic whose Fill in the Blank items are being managed.
 */
export function FillInBlankTab({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<FillInBlankItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    data: items,
    isLoading,
    error,
  } = useQuery<FillInBlankItem[]>({
    queryKey: ['fill-in-blank-items', topicId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/topics/${topicId}/fill-in-blank-items`);
      return data;
    },
  });

  const { paginatedItems, Pagination } = useTablePagination(items);

  const saveMutation = useMutation({
    mutationFn: async (data: FillInBlankFormData) => {
      if (editing) {
        await apiClient.patch(`/admin/fill-in-blank-items/${editing.id}`, data);
      } else {
        await apiClient.post('/admin/fill-in-blank-items', { ...data, topicId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fill-in-blank-items', topicId] });
      setEditing(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/fill-in-blank-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fill-in-blank-items', topicId] });
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

      {showForm && (
        <AddExerciseQuestion
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
