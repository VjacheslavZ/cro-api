import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../api/client';
import type { DistractorSetData } from './DistractorSetsPage';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

type FormData = z.infer<typeof schema>;

interface Props {
  set: DistractorSetData | null;
  onDone: () => void;
}

export function DistractorSetForm({ set, onDone }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!set;

  const [words, setWords] = useState<string[]>(set?.words ?? []);
  const [wordInput, setWordInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { name: set?.name ?? '' },
  });

  const addWord = () => {
    const trimmed = wordInput.trim();
    if (!trimmed || words.includes(trimmed)) return;
    setWords((prev) => [...prev, trimmed]);
    setWordInput('');
  };

  const removeWord = (word: string) => {
    setWords((prev) => prev.filter((w) => w !== word));
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { name: data.name, words };
      if (isEditing) {
        const { data: result } = await apiClient.patch(`/admin/distractor-sets/${set.id}`, payload);
        return result;
      }
      const { data: result } = await apiClient.post('/admin/distractor-sets', payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distractor-sets'] });
      setSuccess(true);
      setError(null);
      if (!isEditing) {
        reset();
        setWords([]);
      }
      setTimeout(() => onDone(), 1500);
    },
    onError: (err: unknown) => {
      setSuccess(false);
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : 'An error occurred');
    },
  });

  const onSubmit = (data: FormData) => {
    setError(null);
    setSuccess(false);
    mutation.mutate(data);
  };

  const hasDuplicates = words.length !== new Set(words).size;

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Set {isEditing ? 'updated' : 'created'} successfully
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          {...register('name')}
          label="Set Name"
          fullWidth
          margin="normal"
          error={!!errors.name}
          helperText={errors.name?.message ?? 'e.g. "Croatian pronouns"'}
        />

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          Words
          {hasDuplicates && (
            <Typography component="span" variant="caption" color="error.main" sx={{ ml: 1 }}>
              duplicates detected
            </Typography>
          )}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {words.map((w) => (
            <Chip key={w} label={w} size="small" onDelete={() => removeWord(w)} />
          ))}
        </Box>

        <Stack direction="row" spacing={0.5}>
          <TextField
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addWord();
              }
            }}
            placeholder="Add word..."
            size="small"
            sx={{ width: 200 }}
          />
          <IconButton size="small" onClick={addWord}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={mutation.isPending || hasDuplicates || words.length === 0}
          sx={{ mt: 3 }}
        >
          {mutation.isPending ? (
            <CircularProgress size={24} />
          ) : isEditing ? (
            'Update Set'
          ) : (
            'Create Set'
          )}
        </Button>
      </Box>
    </Paper>
  );
}
