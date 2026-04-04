import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';

import { useResetCycle } from '../../api/exercises';

interface CycleResetDialogProps {
  open: boolean;
  onReset: () => void;
  onClose: () => void;
  topicId: string;
  exerciseType: string;
}

export function CycleResetDialog({
  open,
  onReset,
  onClose,
  topicId,
  exerciseType,
}: CycleResetDialogProps) {
  const { t } = useTranslation();
  const resetCycle = useResetCycle();

  const handleReset = async () => {
    try {
      await resetCycle.mutateAsync({ topicId, exerciseType });
      onReset();
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('exercises.results.title')}</DialogTitle>
      <DialogContent>
        <Typography>{t('exercises.cycle.exhausted')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('exercises.cycle.back')}</Button>
        <Button variant="contained" onClick={handleReset} disabled={resetCycle.isPending}>
          {t('exercises.cycle.resetAndStart')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
