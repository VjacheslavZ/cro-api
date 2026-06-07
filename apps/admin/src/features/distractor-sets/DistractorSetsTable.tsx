import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../api/client';
import { QueryState } from '../../shared/components/QueryState';
import { ConfirmDeleteDialog } from '../../shared/components/ConfirmDeleteDialog';
import type { DistractorSetData } from './DistractorSetsPage';

interface Props {
  onEdit: (set: DistractorSetData) => void;
}

export function DistractorSetsTable({ onEdit }: Props) {
  const queryClient = useQueryClient();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const {
    data: sets,
    isLoading,
    error,
  } = useQuery<DistractorSetData[]>({
    queryKey: ['admin-distractor-sets'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/distractor-sets');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/distractor-sets/${id}`);
    },
    onSuccess: () => {
      setDeleteTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-distractor-sets'] });
    },
    onError: () => {
      setDeleteTargetId(null);
      alert('Failed to delete distractor set');
    },
  });

  const queryState = QueryState({
    isLoading,
    error,
    errorMessage: 'Failed to load distractor sets',
  });
  if (queryState) return queryState;

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Words</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sets?.map((set) => (
              <TableRow key={set.id}>
                <TableCell sx={{ fontWeight: 600 }}>{set.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {set.words.map((w) => (
                      <Chip key={w} label={w} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onEdit(set)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTargetId(set.id)}
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
        title="Delete Distractor Set"
        message="Are you sure you want to delete this distractor set? This action cannot be undone."
      />
    </>
  );
}
