import { Box, CircularProgress, Alert } from '@mui/material';

interface QueryStateProps {
  isLoading: boolean;
  error: unknown;
  errorMessage?: string;
}

export function QueryState({
  isLoading,
  error,
  errorMessage = 'An error occurred',
}: QueryStateProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{errorMessage}</Alert>;
  }

  return null;
}
