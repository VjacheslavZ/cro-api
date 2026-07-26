import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  TextField,
} from '@mui/material';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import type { LessonFormData } from './lesson-form.schema';

interface LessonDetailsFieldsProps {
  register: UseFormRegister<LessonFormData>;
  errors: FieldErrors<LessonFormData>;
  isActiveDefault: boolean;
  isEditing: boolean;
  isPending: boolean;
}

export function LessonDetailsFields({
  register,
  errors,
  isActiveDefault,
  isEditing,
  isPending,
}: LessonDetailsFieldsProps) {
  return (
    <>
      <Grid container spacing={2}>
        <Grid size={6}>
          <TextField
            {...register('titleHr')}
            label="Title (HR)"
            fullWidth
            margin="normal"
            error={!!errors.titleHr}
            helperText={errors.titleHr?.message}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register('titleEn')}
            label="Title (EN)"
            fullWidth
            margin="normal"
            error={!!errors.titleEn}
            helperText={errors.titleEn?.message}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register('titleUk')}
            label="Title (UK)"
            fullWidth
            margin="normal"
            error={!!errors.titleUk}
            helperText={errors.titleUk?.message}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register('titleRu')}
            label="Title (RU)"
            fullWidth
            margin="normal"
            error={!!errors.titleRu}
            helperText={errors.titleRu?.message}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register('descriptionHr')}
            label="Description (HR)"
            fullWidth
            multiline
            minRows={3}
            margin="normal"
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register('descriptionEn')}
            label="Description (EN)"
            fullWidth
            multiline
            minRows={3}
            margin="normal"
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register('descriptionUk')}
            label="Description (UK)"
            fullWidth
            multiline
            minRows={3}
            margin="normal"
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register('descriptionRu')}
            label="Description (RU)"
            fullWidth
            multiline
            minRows={3}
            margin="normal"
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
        <Grid size={6} sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={<Checkbox {...register('isActive')} defaultChecked={isActiveDefault} />}
            label="Active"
          />
        </Grid>
      </Grid>

      <Button type="submit" variant="contained" fullWidth disabled={isPending} sx={{ mt: 2 }}>
        {isPending ? <CircularProgress size={24} /> : isEditing ? 'Update Lesson' : 'Create Lesson'}
      </Button>
    </>
  );
}
