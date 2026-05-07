import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { ExerciseType } from '@cro/shared';

import {
  getExerciseTypeLabel,
  getExerciseTypeDescription,
} from '../../../shared/lib/exercise-utils.ts';
import { getExerciseTypeIcon } from './exerciseTypeIcon.tsx';

interface Props {
  type: ExerciseType;
  isPending: boolean;
  onStart: () => void;
}

export function ExerciseTypeCard({ type, isPending, onStart }: Props) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        p: 3,
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 2,
        bgcolor: 'white',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          borderColor: '#93c5fd',
        },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 64,
          height: 64,
          bgcolor: 'grey.50',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {getExerciseTypeIcon(type)}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.25 }}>
          {getExerciseTypeLabel(type, t)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getExerciseTypeDescription(type, t)}
        </Typography>
      </Box>

      <Button
        variant="contained"
        endIcon={
          isPending ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <ArrowForward />
        }
        onClick={onStart}
        disabled={isPending}
        sx={{ flexShrink: 0, minWidth: 120 }}
      >
        {t('exercises.start')}
      </Button>
    </Box>
  );
}
