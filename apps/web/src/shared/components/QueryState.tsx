import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Alert } from '@mui/material';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
}

export function QueryState({ isLoading, isError }: QueryStateProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Box>
    );
  }

  return null;
}
