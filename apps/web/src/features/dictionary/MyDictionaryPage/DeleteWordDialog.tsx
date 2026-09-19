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
import { useDeleteWord } from '@/api/dictionary.ts';

interface DeleteWordDialogProps {
  /** The word pending deletion. Passing `null` closes the dialog. */
  word: DictionaryWord | null;
  /** Called after the word has been deleted (before `onClose`). */
  onDeleted: (wordId: string) => void;
  onClose: () => void;
}

/** Confirmation dialog for deleting a single word. Owns the delete mutation. */
export function DeleteWordDialog({ word, onDeleted, onClose }: DeleteWordDialogProps) {
  const { t } = useTranslation();
  const deleteWord = useDeleteWord();

  const handleConfirm = async () => {
    if (!word) return;
    await deleteWord.mutateAsync(word.id);
    onDeleted(word.id);
    onClose();
  };

  return (
    <AlertDialog open={word !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('dictionary.deleteConfirm.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('dictionary.deleteConfirm.message', { word: word?.wordHr })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteWord.isPending}
          >
            {t('dictionary.deleteConfirm.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
