/**
 * @module TypeTheAnswer/AddExerciseQuestion
 * @description Controlled add/edit form for a Type the Answer item. Exports SingularPluralFormData
 * (Zod-inferred, used by TypeTheAnswer's saveMutation) and SingularPluralItem (shape returned by
 * the API, used by ContentTable and TypeTheAnswer). Validates baseForm uniqueness client-side on
 * blur via GET /admin/topics/:id/singular-plural-items — sets a field error if a duplicate exists
 * (excluding the item currently being edited). Resets to editing item values when the editing prop
 * changes via useEffect + reset. Note: all identifiers are named SingularPlural* pending a rename
 * to TypeTheAnswer* (see TODO comments).
 * @usedBy TypeTheAnswer
 */
import { useEffect } from 'react';
import { Box, Button, CircularProgress, TextField, Stack, Paper } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { apiClient } from '../../../api/client.ts';

const schema = z.object({
  baseForm: z.string().min(1, 'Required'),
  pluralForm: z.string().min(1, 'Required'),
  translationRu: z.string().min(1, 'Required'),
  translationUk: z.string().min(1, 'Required'),
  translationEn: z.string().min(1, 'Required'),
  sortOrder: z.coerce.number().int().min(0),
});
// TODO rename to TypeTeAnswerData
/** Validated form payload for creating or updating a Type the Answer item. */
export type SingularPluralFormData = z.infer<typeof schema>;
// TODO rename to TypeTeAnswerItem
/** Shape of a Type the Answer item as returned by GET /admin/topics/:id/singular-plural-items. */
export interface SingularPluralItem {
  id: string;
  baseForm: string;
  pluralForm: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
}
// TODO rename to TypeTeAnswerFormData
const defaultValues: SingularPluralFormData = {
  baseForm: '',
  pluralForm: '',
  translationRu: '',
  translationUk: '',
  translationEn: '',
  sortOrder: 0,
};
// TODO rename to TypeTeAnswerFormProps
interface SingularPluralFormProps {
  topicId: string;
  editing: SingularPluralItem | null;
  isPending: boolean;
  onSubmit: (data: SingularPluralFormData) => void;
}

/**
 * Renders the add/edit form for a Type the Answer item. Validates baseForm uniqueness on blur.
 * @param props.topicId - Used for the uniqueness check query; not submitted with the form.
 * @param props.editing - Item being edited; null when creating. Resets form on change.
 * @param props.isPending - Disables submit while the parent saveMutation is in flight.
 * @param props.onSubmit - Called with validated form data; parent calls saveMutation.mutate().
 */
export function AddExerciseQuestion({
  topicId,
  editing,
  isPending,
  onSubmit,
}: SingularPluralFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SingularPluralFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  });

  useEffect(() => {
    reset(editing ?? defaultValues);
  }, [editing, reset]);

  const validateBaseFormUnique = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      const { data: allItems } = await apiClient.get<SingularPluralItem[]>(
        // TODO replace /singular-plural-items to /type-the-answer
        `/admin/topics/${topicId}/singular-plural-items`,
      );
      const duplicate = allItems.find(
        (item) => item.baseForm === trimmed && item.id !== editing?.id,
      );
      if (duplicate) {
        setError('baseForm', { message: 'This word already exists' });
      } else {
        clearErrors('baseForm');
      }
    } catch {
      // skip validation on network error
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            {...register('baseForm', {
              onBlur: (e) => validateBaseFormUnique(e.target.value),
            })}
            label="Base Form"
            size="small"
            error={!!errors.baseForm}
            helperText={errors.baseForm?.message}
          />
          <TextField
            {...register('pluralForm')}
            label="Plural Form"
            size="small"
            error={!!errors.pluralForm}
            helperText={errors.pluralForm?.message}
          />
          <TextField
            {...register('sortOrder')}
            label="Order"
            type="number"
            size="small"
            sx={{ width: 80 }}
          />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            {...register('translationRu')}
            label="Translation (RU)"
            size="small"
            error={!!errors.translationRu}
          />
          <TextField
            {...register('translationUk')}
            label="Translation (UK)"
            size="small"
            error={!!errors.translationUk}
          />
          <TextField
            {...register('translationEn')}
            label="Translation (EN)"
            size="small"
            error={!!errors.translationEn}
          />
        </Stack>
        <Button type="submit" variant="contained" size="small" disabled={isPending}>
          {isPending ? <CircularProgress size={20} /> : editing ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Paper>
  );
}
