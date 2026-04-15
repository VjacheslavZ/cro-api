import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import type { DictionaryWord } from '@cro/shared';

/**
 * Confirmation dialog shown before permanently deleting a word from the
 * user's personal dictionary.
 *
 * Used in: MyDictionaryPage — opened when the delete icon on a WordRow is
 * clicked.
 *
 * Displays the Croatian word in the message so the user can verify the
 * correct word is being deleted. The confirm button is disabled while the
 * delete mutation is in-flight.
 */
interface DeleteWordDialogProps {
  /** The word pending deletion. Passing `null` closes the dialog. */
  word: DictionaryWord | null;
  /** Disables the confirm button while the delete request is in-flight. */
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteWordDialog({ word, isPending, onConfirm, onCancel }: DeleteWordDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={word !== null} onClose={onCancel}>
      <DialogTitle>{t('dictionary.deleteConfirm.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('dictionary.deleteConfirm.message', { word: word?.wordHr })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={isPending}>
          {t('dictionary.deleteConfirm.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
