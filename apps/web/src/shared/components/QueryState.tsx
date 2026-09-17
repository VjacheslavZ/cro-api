import { useTranslation } from 'react-i18next';
import { AlertCircleIcon } from 'lucide-react';

import { Spinner } from '@/components/Spinner';
import { Alert, AlertTitle } from '@/components/ui/alert';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
}

export function QueryState({ isLoading, isError }: QueryStateProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{t('common.error')}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return null;
}
