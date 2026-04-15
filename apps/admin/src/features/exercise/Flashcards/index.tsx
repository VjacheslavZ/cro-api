/**
 * @module Flashcards
 * @description Tab content for managing Flashcard exercise items within a topic. Fetches items
 * via ['flashcard-items', topicId] from GET /admin/topics/:id/flashcard-items. saveMutation
 * handles add (POST /admin/flashcard-items) and edit (PATCH /admin/flashcard-items/:id).
 * Uses useTablePagination for client-side pagination. Inline form is toggled by the "Add Item"
 * button; editing a row pre-populates the form via AddExerciseQuestion's useEffect reset.
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
  type FlashcardFormData,
  type FlashcardItem,
} from './AddExerciseQuestion.tsx';
import { ContentTable } from './ContentTable.tsx';

/**
 * Renders the Flashcard item list with inline add/edit form for a given topic.
 * @param topicId - The topic whose Flashcard items are being managed.
 */
export function Flashcards({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<FlashcardItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    data: items,
    isLoading,
    error,
  } = useQuery<FlashcardItem[]>({
    queryKey: ['flashcard-items', topicId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/topics/${topicId}/flashcard-items`);
      return data;
    },
  });

  const { paginatedItems, Pagination } = useTablePagination(items);

  const saveMutation = useMutation({
    mutationFn: async (data: FlashcardFormData) => {
      if (editing) {
        await apiClient.patch(`/admin/flashcard-items/${editing.id}`, data);
      } else {
        await apiClient.post('/admin/flashcard-items', { ...data, topicId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-items', topicId] });
      setEditing(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/flashcard-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-items', topicId] });
    },
  });

  const queryState = QueryState({ isLoading, error, errorMessage: 'Failed to load items' });
  if (queryState) return queryState;

  return (
    <Box>
      <span>Flash</span>
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
