/**
 * @module BuildSentenceTab
 * @description Tab for managing Build Sentence items within a topic. Items fetched from
 * GET /admin/topics/:id/build-sentence-items. saveMutation handles add (POST) and edit (PATCH).
 * Each item stores the Croatian sentence split into words with per-word distractors.
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
  AddBuildSentenceItem,
  type BuildSentenceFormData,
  type BuildSentenceItemData,
} from './AddBuildSentenceItem/AddBuildSentenceItem.tsx';
import { ContentTable } from './ContentTable.tsx';

export function BuildSentenceTab({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<BuildSentenceItemData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    data: items,
    isLoading,
    error,
  } = useQuery<BuildSentenceItemData[]>({
    queryKey: ['build-sentence-items', topicId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/topics/${topicId}/build-sentence-items`);
      return data;
    },
  });

  const { paginatedItems, Pagination } = useTablePagination(items);

  const saveMutation = useMutation({
    mutationFn: async (data: BuildSentenceFormData) => {
      const payload = {
        translationRu: data.translationRu,
        translationUk: data.translationUk,
        translationEn: data.translationEn,
        sortOrder: data.sortOrder,
        words: data.words,
      };
      if (editing) {
        await apiClient.patch(`/admin/build-sentence-items/${editing.id}`, {});
      } else {
        await apiClient.post('/admin/build-sentence-items', { ...payload, topicId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-sentence-items', topicId] });
      if (editing) {
        setEditing(null);
        setShowForm(false);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/build-sentence-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-sentence-items', topicId] });
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
        <AddBuildSentenceItem
          topicId={topicId}
          editing={editing}
          isPending={saveMutation.isPending}
          onSubmit={(d) => saveMutation.mutateAsync(d)}
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
