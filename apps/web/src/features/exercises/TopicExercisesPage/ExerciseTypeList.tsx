import { Alert, Box, Typography } from '@mui/material';
import { Layers } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { ExerciseType } from '@cro/shared';

import { ExerciseTypeCard } from './ExerciseTypeCard.tsx';

interface Props {
  exerciseTypes: ExerciseType[];
  isPending: boolean;
  isError: boolean;
  onStart: (type: string) => void;
}

export function ExerciseTypeList({ exerciseTypes, isPending, isError, onStart }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {exerciseTypes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'grey.100',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Layers sx={{ fontSize: 32, color: 'grey.400' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
            {t('exercises.noTypes')}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {exerciseTypes.map((type) => (
            <ExerciseTypeCard
              key={type}
              type={type}
              isPending={isPending}
              onStart={() => onStart(type)}
            />
          ))}
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t('common.error')}
        </Alert>
      )}
    </>
  );
}
