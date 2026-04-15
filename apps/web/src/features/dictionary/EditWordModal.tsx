import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import type { DictionaryWord } from '@cro/shared';

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        onEntered: () => wordRef.current?.focus(),
      }}
    >
      <DialogTitle>{t('dictionary.editWordModal.title')}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label={t('dictionary.editWordModal.wordLabel')}
          value={wordHr}
          onChange={(e) => setWordHr(e.target.value)}
          inputRef={wordRef}
          sx={{ mt: 1, mb: 2 }}
        />
        <TextField
          fullWidth
          label={t('dictionary.editWordModal.translationLabel')}
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSave) void handleSubmit();
          }}
          sx={{ mb: 1 }}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dictionary.editWordModal.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSave}>
          {t('dictionary.editWordModal.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
