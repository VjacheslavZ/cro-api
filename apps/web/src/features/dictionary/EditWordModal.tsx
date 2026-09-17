import { useState, useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictionaryWord } from '@cro/shared';

import { ErrorAlert } from '@/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useUpdateWord } from '../../api/dictionary';

/**
 * Modal dialog for editing an existing word in the user's personal dictionary.
 *
 * Used in: MyDictionaryPage — opened via the edit icon on a WordRow.
 *
 * Behaviour:
 * - Pre-fills both fields from the selected word; Croatian word field receives
 *   focus after the dialog animation completes.
 * - Save is disabled when both fields match the original values (no changes).
 * - Enter key in the Translation field submits when the form is valid.
 * - Returns a 409 duplicate error (case-insensitive match) as an inline Alert.
 */
interface EditWordModalProps {
  open: boolean;
  /** The word to edit. Passing `null` closes the dialog. */
  word: DictionaryWord | null;
  onClose: () => void;
}

export function EditWordModal({ open, word, onClose }: EditWordModalProps) {
  const { t } = useTranslation();
  const id = useId();
  const [wordHr, setWordHr] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState('');
  const wordRef = useRef<HTMLInputElement>(null);

  const updateWord = useUpdateWord();

  useEffect(() => {
    if (open && word) {
      setWordHr(word.wordHr);
      setTranslation(word.translation);
      setError('');
    }
  }, [open, word]);

  const handleSubmit = async () => {
    if (!word) return;
    setError('');
    try {
      await updateWord.mutateAsync({
        wordId: word.id,
        wordHr: wordHr.trim(),
        translation: translation.trim(),
      });
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 409) {
          setError(t('dictionary.editWordModal.duplicate'));
          return;
        }
      }
      setError(t('common.error'));
    }
  };

  const canSave =
    wordHr.trim().length > 0 &&
    translation.trim().length > 0 &&
    !updateWord.isPending &&
    (wordHr.trim() !== word?.wordHr || translation.trim() !== word?.translation);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg" initialFocus={wordRef}>
        <DialogHeader>
          <DialogTitle>{t('dictionary.editWordModal.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-word`}>{t('dictionary.editWordModal.wordLabel')}</Label>
            <Input
              id={`${id}-word`}
              value={wordHr}
              onChange={(e) => setWordHr(e.target.value)}
              ref={wordRef}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-translation`}>
              {t('dictionary.editWordModal.translationLabel')}
            </Label>
            <Input
              id={`${id}-translation`}
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSave) void handleSubmit();
              }}
            />
          </div>
          {error && <ErrorAlert message={error} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('dictionary.editWordModal.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            {t('dictionary.editWordModal.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
