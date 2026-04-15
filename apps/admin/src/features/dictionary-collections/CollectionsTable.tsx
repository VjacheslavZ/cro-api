/**
 * @module CollectionsTable
 * @description Table listing all predefined dictionary collections with word counts.
 * Clicking a row navigates to CollectionWordsPage. Edit opens the form tab in the parent.
 * Delete shows ConfirmDeleteDialog and calls DELETE /admin/dictionary-collections/:id,
 * which cascades to remove all predefined words in that collection.
 * Invalidates ['admin-dictionary-collections'] on delete success.
 * @usedBy DictionaryCollectionsPage
 */
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
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../api/client';
import { QueryState } from '../../shared/components/QueryState';
import { ConfirmDeleteDialog } from '../../shared/components/ConfirmDeleteDialog';
import type { CollectionData } from './DictionaryCollectionsPage';

interface CollectionsTableProps {
  onEdit: (collection: CollectionData) => void;
}

/**
 * Renders the collections data table with row-click navigation and edit/delete actions.
 * @param props.onEdit - Called with the selected collection when the Edit icon is clicked;
 *   parent switches to the form tab pre-populated with this data
 */
export function CollectionsTable({ onEdit }: CollectionsTableProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const {
    data: collections,
    isLoading,
    error,
  } = useQuery<CollectionData[]>({
    queryKey: ['admin-dictionary-collections'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/dictionary-collections');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/dictionary-collections/${id}`);
    },
    onSuccess: () => {
      setDeleteTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-dictionary-collections'] });
    },
    onError: () => {
      setDeleteTargetId(null);
      alert('Failed to delete collection');
    },
  });

  const queryState = QueryState({ isLoading, error, errorMessage: 'Failed to load collections' });
  if (queryState) return queryState;

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Words</TableCell>
              <TableCell>Sort Order</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {collections?.map((collection) => (
              <TableRow
                key={collection.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/dictionary-collections/${collection.id}/words`)}
              >
                <TableCell>{collection.name}</TableCell>
                <TableCell>{collection.description ?? '-'}</TableCell>
                <TableCell>
                  <Chip label={collection.predefinedWordCount} size="small" color="primary" />
                </TableCell>
                <TableCell>{collection.sortOrder}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(collection);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(collection.id);
                    }}
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
        title="Delete Collection"
        message="Are you sure you want to delete this collection? All predefined words in it will be removed. This action cannot be undone."
      />
    </>
  );
}
