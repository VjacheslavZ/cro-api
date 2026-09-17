import { useTranslation } from 'react-i18next';
import type { DictionaryWord } from '@cro/shared';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
    <AlertDialog open={word !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('dictionary.deleteConfirm.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('dictionary.deleteConfirm.message', { word: word?.wordHr })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={isPending}>
            {t('dictionary.deleteConfirm.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
