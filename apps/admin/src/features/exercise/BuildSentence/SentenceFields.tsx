import { Stack, TextField } from '@mui/material';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';

import type { BuildSentenceFormData } from './schema';

interface Props {
  register: UseFormRegister<BuildSentenceFormData>;
  errors: FieldErrors<BuildSentenceFormData>;
  onSentenceBlur: () => void;
}

export function SentenceFields({ register, errors, onSentenceBlur }: Props) {
  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <TextField
          {...register('sentenceHr')}
          label="Croatian sentence"
          size="small"
          fullWidth
          placeholder="Katerina gleda kazališne predstave."
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
          error={!!errors.translationRu}
          helperText={errors.translationRu?.message}
        />
        <TextField
          {...register('translationUk')}
          label="Translation (UK)"
          size="small"
          fullWidth
          error={!!errors.translationUk}
          helperText={errors.translationUk?.message}
        />
        <TextField
          {...register('translationEn')}
          label="Translation (EN)"
          size="small"
          fullWidth
          error={!!errors.translationEn}
          helperText={errors.translationEn?.message}
        />
      </Stack>
    </>
  );
}
