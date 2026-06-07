import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  Alert,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import type { DictionaryCollection } from '@cro/shared';

import {
  useAddWord,
  useTranslationSuggestions,
  useAiTranslation,
} from '../../../api/dictionary.ts';

/**
 * Modal dialog for adding a new word to the user's personal dictionary.
 *
 * Used in: MyDictionaryPage — opened via the "Add Word" button or by pressing
 * Enter in the search field (pre-fills `initialWord` with the search text).
 *
 * Behaviour:
 * - When `initialWord` is provided the Translation field receives focus after
 *   the dialog animation completes.
 * - Fetches shared translation suggestions as the user types (≥ 2 chars).
 * - Calls `onSuccess` after a successful save so the parent can reset the
 *   search input.
 * - Returns a 409 duplicate error (case-insensitive match) as an inline Alert.
 */
interface AddWordModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after the word is successfully added. */
  onSuccess?: () => void;
  /** Pre-fills the Croatian word field and shifts focus to Translation. */
  initialWord?: string;
  collections: DictionaryCollection[];
}

export function AddWordModal({
  open,
  onClose,
  onSuccess,
  initialWord = '',
  collections,
}: AddWordModalProps) {
  const { t } = useTranslation();
  const [wordHr, setWordHr] = useState(initialWord);
  const [debouncedWord, setDebouncedWord] = useState(initialWord);
  const [translation, setTranslation] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [error, setError] = useState('');

  const translationRef = useRef<HTMLInputElement>(null);

  const addWord = useAddWord();
  const { data: suggestions, isLoading: suggestionsLoading } =
    useTranslationSuggestions(debouncedWord);
  const { data: aiData, isFetching: aiLoading } = useAiTranslation(debouncedWord);
  const aiTranslations = aiData?.translations ?? [];
  const aiSentences = aiData?.sentences ?? [];

  useEffect(() => {
    const id = setTimeout(() => setDebouncedWord(wordHr), 2000);
    return () => clearTimeout(id);
  }, [wordHr]);

  useEffect(() => {
    if (open) {
      setWordHr(initialWord);
      setDebouncedWord(initialWord);
      setTranslation('');
      setCollectionId('');
      setError('');
    }
  }, [open, initialWord]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && wordHr.trim() && translation.trim() && !addWord.isPending) {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setError('');
    try {
      await addWord.mutateAsync({
        wordHr: wordHr.trim(),
        translation: translation.trim(),
        ...(collectionId ? { collectionId } : {}),
      });
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 409) {
          setError(t('dictionary.addWordModal.duplicate'));
          return;
        }
      }
      setError(t('common.error'));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        onEntered: () => {
          if (initialWord) translationRef.current?.focus();
        },
      }}
    >
      <DialogTitle>{t('dictionary.addWordModal.title')}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label={t('dictionary.addWordModal.wordLabel')}
          value={wordHr}
          onChange={(e) => setWordHr(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          autoFocus={!initialWord}
        />

        <TextField
          fullWidth
          label={t('dictionary.addWordModal.translationLabel')}
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          inputRef={translationRef}
          onKeyDown={handleKeyDown}
          sx={{ mb: 1 }}
        />

        {wordHr.length >= 2 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
              {suggestionsLoading && <CircularProgress size={20} />}
              {!suggestionsLoading &&
                suggestions?.map((s) => (
                  <Chip
                    key={s.translation}
                    label={`${s.translation} (${s.count})`}
                    onClick={() => setTranslation(s.translation)}
                    color={translation === s.translation ? 'primary' : 'default'}
                    variant={translation === s.translation ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
              {aiLoading && <CircularProgress size={14} />}
              {!aiLoading &&
                aiTranslations.map((tr) => (
                  <Chip
                    key={tr}
                    label={tr}
                    onClick={() => setTranslation(tr)}
                    color={translation === tr ? 'primary' : 'default'}
                    variant={translation === tr ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
            </Box>

            {!aiLoading && aiSentences.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {aiSentences.map((s) => (
                  <Box key={s.hr} sx={{ mb: 0.5 }} display="flex">
                    <Typography variant="body2">{s.hr} - </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.translation}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {collections.length > 0 && (
          <FormControl fullWidth>
            <InputLabel>{t('dictionary.addWordModal.collectionLabel')}</InputLabel>
            <Select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              label={t('dictionary.addWordModal.collectionLabel')}
            >
              <MenuItem value="">—</MenuItem>
              {collections.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('dictionary.addWordModal.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!wordHr.trim() || !translation.trim() || addWord.isPending}
        >
          {t('dictionary.addWordModal.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
