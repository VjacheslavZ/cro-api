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
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import type { DictionaryCollection } from '@cro/shared';

import { useAddWord, useTranslationSuggestions } from '../../../api/dictionary.ts';

interface AddWordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
  const [translation, setTranslation] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [error, setError] = useState('');

  const translationRef = useRef<HTMLInputElement>(null);

  const addWord = useAddWord();
  const { data: suggestions, isLoading: suggestionsLoading } = useTranslationSuggestions(wordHr);

  useEffect(() => {
    if (open) {
      setWordHr(initialWord);
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

        {wordHr.length >= 2 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('dictionary.addWordModal.suggestions')}
            </Typography>
            {suggestionsLoading ? (
              <CircularProgress size={20} />
            ) : suggestions && suggestions.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {suggestions.map((s) => (
                  <Chip
                    key={s.translation}
                    label={`${s.translation} (${s.count})`}
                    onClick={() => setTranslation(s.translation)}
                    color={translation === s.translation ? 'primary' : 'default'}
                    variant={translation === s.translation ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('dictionary.addWordModal.noSuggestions')}
              </Typography>
            )}
          </Box>
        )}

        <TextField
          fullWidth
          label={t('dictionary.addWordModal.translationLabel')}
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          inputRef={translationRef}
          onKeyDown={handleKeyDown}
          sx={{ mb: 2 }}
        />

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
