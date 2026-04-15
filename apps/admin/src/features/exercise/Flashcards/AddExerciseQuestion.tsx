/**
 * @module Flashcards/AddExerciseQuestion
 * @description Controlled add/edit form for a Flashcard exercise item. Exports FlashcardFormData
 * (Zod-inferred, used by Flashcards' saveMutation) and FlashcardItem (shape returned by the API,
 * used by ContentTable and Flashcards). Resets to editing item values when the editing prop
 * changes via useEffect + reset. frontText is the Croatian side shown to the student.
 * @usedBy Flashcards
 */
import { useEffect } from 'react';
import { Box, Button, CircularProgress, TextField, Stack, Paper } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  frontText: z.string().min(1, 'Required'),
  translationRu: z.string().min(1, 'Required'),
  translationUk: z.string().min(1, 'Required'),
  translationEn: z.string().min(1, 'Required'),
  sortOrder: z.coerce.number().int().min(0),
});

/** Validated form payload for creating or updating a Flashcard item. */
export type FlashcardFormData = z.infer<typeof schema>;

/** Shape of a Flashcard item as returned by GET /admin/topics/:id/flashcard-items. */
export interface FlashcardItem {
  id: string;
  frontText: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
}

const defaultValues: FlashcardFormData = {
  frontText: '',
  translationRu: '',
  translationUk: '',
  translationEn: '',
  sortOrder: 0,
};

interface FlashcardFormProps {
  editing: FlashcardItem | null;
  isPending: boolean;
  onSubmit: (data: FlashcardFormData) => void;
}

/**
 * Renders the add/edit form for a Flashcard item. Resets field values when the editing prop changes.
 * @param props.editing - Item being edited; null when creating.
 * @param props.isPending - Disables submit while the parent saveMutation is in flight.
 * @param props.onSubmit - Called with validated form data; parent calls saveMutation.mutate().
 */
export function AddExerciseQuestion({ editing, isPending, onSubmit }: FlashcardFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FlashcardFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  });

  useEffect(() => {
    reset(editing ?? defaultValues);
  }, [editing, reset]);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            {...register('frontText')}
            label="Front Text (HR)"
            size="small"
            error={!!errors.frontText}
            helperText={errors.frontText?.message}
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
