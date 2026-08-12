import { useState } from 'react';
import {
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Lesson } from '@cro/shared';

import { apiClient } from '../../api/client';
import { ConfirmDeleteDialog } from '../../shared/components/ConfirmDeleteDialog';
import { QueryState } from '../../shared/components/QueryState';

interface LessonsTableProps {
  onEdit: (lesson: Lesson) => void;
}

export function LessonsTable({ onEdit }: LessonsTableProps) {
  const queryClient = useQueryClient();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const {
    data: lessons,
    isLoading,
    error,
  } = useQuery<Lesson[]>({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/lessons');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/lessons/${id}`);
    },
    onSuccess: () => {
      setDeleteTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
    onError: () => {
      setDeleteTargetId(null);
    },
  });

  const queryState = QueryState({ isLoading, error, errorMessage: 'Failed to load lessons' });
  if (queryState) return queryState;

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Sort Order</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lessons?.map((lesson) => (
              <TableRow key={lesson.id} hover>
                <TableCell>{lesson.titleEn}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: 240,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lesson.descriptionEn ?? '—'}
                </TableCell>
                <TableCell>{lesson.items.length}</TableCell>
                <TableCell>{lesson.sortOrder}</TableCell>
                <TableCell>
                  <Chip
                    label={lesson.isActive ? 'Yes' : 'No'}
                    color={lesson.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onEdit(lesson)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTargetId(lesson.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDeleteDialog
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteMutation.mutate(deleteTargetId);
        }}
        isPending={deleteMutation.isPending}
        title="Delete Lesson"
        message="Are you sure you want to delete this lesson? This action cannot be undone."
      />
    </>
  );
}
