import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircleIcon } from 'lucide-react';

import { Alert, AlertAction, AlertTitle } from '@/components/ui/alert';

interface ErrorAlertProps {
  /** Defaults to the generic `common.error` message. */
  message?: string;
  /** Optional action rendered on the right (e.g. a retry button). */
  action?: ReactNode;
  className?: string;
}

/** Replacement for MUI `<Alert severity="error">`. */
export function ErrorAlert({ message, action, className }: ErrorAlertProps) {
  const { t } = useTranslation();

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircleIcon />
      <AlertTitle>{message ?? t('common.error')}</AlertTitle>
      {action && <AlertAction>{action}</AlertAction>}
    </Alert>
  );
}
