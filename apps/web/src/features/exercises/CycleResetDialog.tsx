/**
 * @module CycleResetDialog
 * @description Confirmation dialog shown when a user's exercise cycle is exhausted
 * (all items have been seen). Calls the reset-cycle API and re-starts the session on confirm.
 * @usedBy TopicExercisesPage
 */
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

/**
 * Prompts the user to confirm resetting their exercise cycle, then fires the reset mutation.
 * @param props.open - Whether the dialog is visible
 * @param props.onReset - Called after successful reset; parent should restart the session
 * @param props.onClose - Called when user dismisses without resetting
 * @param props.topicId - Topic whose cycle will be reset
 * @param props.exerciseType - Exercise type whose cycle will be reset
 */
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
