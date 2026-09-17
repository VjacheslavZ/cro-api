/**
 * @module StopExerciseDialog
 * @description Generic confirmation dialog for stopping an in-progress exercise session.
 * Calls onConfirm when the user confirms, onClose when they cancel.
 * @usedBy SessionPage, LearnWordsPreviewPage, LearnWordsSessionPage
 */
import { useTranslation } from 'react-i18next';

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
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('exercises.session.stopTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('exercises.session.stopMessage')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {t('exercises.session.stopConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
