import { CircularProgress, InputAdornment, Stack, TextField } from '@mui/material';
import type { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';

import type { BuildSentenceFormData } from './schema';

interface Props {
  register: UseFormRegister<BuildSentenceFormData>;
  watch: UseFormWatch<BuildSentenceFormData>;
  errors: FieldErrors<BuildSentenceFormData>;
  onSentenceBlur: () => void;
  isCheckingDuplicate?: boolean;
}

export function SentenceFields({
  register,
  watch,
  errors,
  onSentenceBlur,
  isCheckingDuplicate,
}: Props) {
  const sentenceHr = watch('sentenceHr');
  const translationRu = watch('translationRu');
  const translationUk = watch('translationUk');
  const translationEn = watch('translationEn');

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <TextField
          {...register('sentenceHr')}
          label="Croatian sentence"
          size="small"
          fullWidth
          placeholder="Katerina gleda kazališne predstave."
          slotProps={{
            inputLabel: { shrink: !!sentenceHr },
            input: isCheckingDuplicate
              ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <CircularProgress size={14} />
                    </InputAdornment>
                  ),
                }
              : undefined,
          }}
          error={!!errors.sentenceHr}
          helperText={errors.sentenceHr?.message ?? 'Press Tab/click away to split into words'}
          onBlur={onSentenceBlur}
        />
        <TextField
          {...register('sortOrder')}
          label="Order"
          type="number"
          size="small"
          sx={{ width: 80 }}
        />
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <TextField
          {...register('translationRu')}
          label="Translation (RU)"
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: !!translationRu } }}
          error={!!errors.translationRu}
          helperText={errors.translationRu?.message}
        />
        <TextField
          {...register('translationUk')}
          label="Translation (UK)"
          size="small"
          fullWidth
          slotProps={{
            inputLabel: { shrink: !!translationUk },
          }}
          error={!!errors.translationUk}
          helperText={errors.translationUk?.message}
        />
        <TextField
          {...register('translationEn')}
          label="Translation (EN)"
          size="small"
          fullWidth
          slotProps={{
            inputLabel: { shrink: !!translationEn },
          }}
          error={!!errors.translationEn}
          helperText={errors.translationEn?.message}
        />
      </Stack>
    </>
  );
}
