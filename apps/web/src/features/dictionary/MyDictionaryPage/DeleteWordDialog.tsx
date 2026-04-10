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

interface DeleteWordDialogProps {
  word: DictionaryWord | null;
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
