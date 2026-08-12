/**
 * @module AddWordForm
 * @description Controlled add/edit form for a single predefined word. Exports PredefinedWordFormData
 * (Zod-inferred type used by CollectionWordsPage's saveMutation) and PredefinedWordItem (shape
 * returned by GET .../words, used by WordsTable and CollectionWordsPage). The form resets to the
 * editing item's values whenever the editing prop changes (via useEffect + reset), enabling the
 * parent to switch between create and edit mode without unmounting this component.
 * @usedBy CollectionWordsPage
 */
import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, TextField, Stack, Paper } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAdminAiTranslation } from '../../../api/dictionary';

const schema = z.object({
  wordHr: z.string().min(1, 'Required').max(100),
  translationRu: z.string().min(1, 'Required').max(200),
  translationUk: z.string().min(1, 'Required').max(200),
  translationEn: z.string().min(1, 'Required').max(200),
  sortOrder: z.coerce.number().int().min(0),
});

/** Validated form payload for creating or updating a predefined word. Used as the mutationFn argument in CollectionWordsPage. */
export type PredefinedWordFormData = z.infer<typeof schema>;

/** Shape of a predefined word as returned by GET /admin/dictionary-collections/:id/words. */
export interface PredefinedWordItem {
  id: string;
  wordHr: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
}

const defaultValues: PredefinedWordFormData = {
  wordHr: '',
  translationRu: '',
  translationUk: '',
  translationEn: '',
  sortOrder: 0,
};

interface AddWordFormProps {
  editing: PredefinedWordItem | null;
  isPending: boolean;
  onSubmit: (data: PredefinedWordFormData) => void;
}

/**
 * Renders the add/edit word form. Resets field values whenever the editing prop changes.
 * @param props.editing - Word being edited; null when creating a new word.
 * @param props.isPending - Disables the submit button while the parent's saveMutation is in flight.
 * @param props.onSubmit - Called with validated form data; parent calls saveMutation.mutate().
 */
export function AddWordForm({ editing, isPending, onSubmit }: AddWordFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PredefinedWordFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  });

  const wordHr = watch('wordHr');
  const [debouncedWord, setDebouncedWord] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedWord(wordHr), 2000);
    return () => clearTimeout(id);
  }, [wordHr]);

  const { data: aiData, isFetching: aiLoading } = useAdminAiTranslation(debouncedWord);

  useEffect(() => {
    if (!aiData) return;
    if (aiData.translationRu) setValue('translationRu', aiData.translationRu);
    if (aiData.translationUk) setValue('translationUk', aiData.translationUk);
    if (aiData.translationEn) setValue('translationEn', aiData.translationEn);
  }, [aiData, setValue]);

  useEffect(() => {
    reset(editing ?? defaultValues);
  }, [editing, reset]);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            {...register('wordHr')}
            label="Word (HR)"
            size="small"
            error={!!errors.wordHr}
            helperText={errors.wordHr?.message}
          />
          <TextField
            {...register('sortOrder')}
            label="Order"
            type="number"
            size="small"
            sx={{ width: 80 }}
          />
        </Stack>
        <Stack direction="column" spacing={1} sx={{ mb: 1 }} alignItems="center">
          <TextField
            {...register('translationRu')}
            label="Translation (RU)"
            size="small"
            fullWidth
            error={!!errors.translationRu}
            InputLabelProps={{ shrink: !!watch('translationRu') || undefined }}
          />
          <TextField
            fullWidth
            {...register('translationUk')}
            label="Translation (UK)"
            size="small"
            error={!!errors.translationUk}
            InputLabelProps={{ shrink: !!watch('translationUk') || undefined }}
          />
          <TextField
            {...register('translationEn')}
            label="Translation (EN)"
            size="small"
            fullWidth
            error={!!errors.translationEn}
            InputLabelProps={{ shrink: !!watch('translationEn') || undefined }}
          />
          {aiLoading && <CircularProgress size={16} />}
        </Stack>
        <Button type="submit" variant="contained" size="small" disabled={isPending}>
          {isPending ? <CircularProgress size={20} /> : editing ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Paper>
  );
}
