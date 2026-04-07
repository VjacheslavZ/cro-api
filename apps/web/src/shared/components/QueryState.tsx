import { useTranslation } from 'react-i18next';
import { Container, CircularProgress, Alert } from '@mui/material';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
}

export function QueryState({ isLoading, isError }: QueryStateProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Container>
    );
  }

  return null;
}
