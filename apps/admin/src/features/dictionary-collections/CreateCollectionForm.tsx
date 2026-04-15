/**
 * @module CreateCollectionForm
 * @description Create/edit form for a predefined dictionary collection. Dual-mode: POST to
 * /admin/dictionary-collections when creating, PATCH to /admin/dictionary-collections/:id when
 * editing. On success invalidates ['admin-dictionary-collections'] and calls onDone() after
 * a 1500 ms delay (long enough to show the success alert). Form resets to empty on create
 * success; on edit the parent switches the tab away via onDone().
 * @usedBy DictionaryCollectionsPage
 */
import { useState } from 'react';
import { Box, Button, TextField, Alert, CircularProgress, Paper, Grid } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../api/client';
import type { CollectionData } from './DictionaryCollectionsPage';

const collectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0, 'Sort order must be >= 0'),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

interface CreateCollectionFormProps {
  collection: CollectionData | null;
  onDone: () => void;
}

/**
 * Renders the create/edit form for a predefined dictionary collection.
 * @param props.collection - Populated when editing an existing collection; null when creating.
 * @param props.onDone - Called after the 1500 ms success delay; parent switches back to the table tab.
 */
export function CreateCollectionForm({ collection, onDone }: CreateCollectionFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isEditing = !!collection;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema) as never,
    defaultValues: collection
      ? {
          name: collection.name,
          description: collection.description ?? '',
          sortOrder: collection.sortOrder,
        }
      : {
          name: '',
          description: '',
          sortOrder: 0,
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      if (isEditing) {
        const { data: result } = await apiClient.patch(
          `/admin/dictionary-collections/${collection.id}`,
          data,
        );
        return result;
      }
      const { data: result } = await apiClient.post('/admin/dictionary-collections', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dictionary-collections'] });
      setSuccess(true);
      setError(null);
      if (!isEditing) reset();
      setTimeout(() => onDone(), 1500);
    },
    onError: (err: unknown) => {
      setSuccess(false);
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else {
        setError('An error occurred');
      }
    },
  });

  const onSubmit = (data: CollectionFormData) => {
    setError(null);
    setSuccess(false);
    mutation.mutate(data);
  };

  return (
    <Paper sx={{ p: 3 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Collection {isEditing ? 'updated' : 'created'} successfully
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          <Grid size={6}>
            <TextField
              {...register('name')}
              label="Name"
              fullWidth
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              {...register('sortOrder')}
              label="Sort Order"
              type="number"
              fullWidth
              margin="normal"
              error={!!errors.sortOrder}
              helperText={errors.sortOrder?.message}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              {...register('description')}
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={mutation.isPending}
          sx={{ mt: 2 }}
        >
          {mutation.isPending ? (
            <CircularProgress size={24} />
          ) : isEditing ? (
            'Update Collection'
          ) : (
            'Create Collection'
          )}
        </Button>
      </Box>
    </Paper>
  );
}
