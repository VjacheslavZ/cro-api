/**
 * @module StopExerciseDialog
 * @description Generic confirmation dialog for stopping an in-progress exercise session.
 * Calls onConfirm when the user confirms, onClose when they cancel.
 * @usedBy LearnWordsPreviewPage, LearnWordsSessionPage
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

interface StopExerciseDialogProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Prompts the user to confirm they want to stop the current exercise session.
 * @param props.open - Whether the dialog is visible
 * @param props.onConfirm - Called when the user confirms stopping
 * @param props.onClose - Called when the user cancels
 */
export function StopExerciseDialog({ open, onConfirm, onClose }: StopExerciseDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('exercises.session.stopTitle')}</DialogTitle>
      <DialogContent>
        <Typography>{t('exercises.session.stopMessage')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          {t('exercises.session.stopConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
