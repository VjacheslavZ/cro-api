import { useTranslation } from 'react-i18next';
import { Box, Checkbox, Chip, IconButton, LinearProgress, Typography } from '@mui/material';
import { Delete, Edit, VolumeUp } from '@mui/icons-material';
import type { DictionaryWord } from '@cro/shared';

import { speakWord } from '../../shared/lib/speech';

/**
 * Single row in the My Dictionary word list.
 *
 * Used in: DictionaryWordList (inside MyDictionaryPage).
 *
 * Displays the Croatian word, its translation, optional collection badge,
 * per-exercise-type progress bar (or "Learned" chip when all types hit 100%),
 * and action icons: edit, speak, delete.
 */
interface WordRowProps {
  word: DictionaryWord;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  /** Opens the EditWordModal for this word. */
  onEdit: (word: DictionaryWord) => void;
  /** Opens the DeleteWordDialog for this word. */
  onDelete: (word: DictionaryWord) => void;
}

export function WordRow({ word, selected, onSelect, onEdit, onDelete }: WordRowProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        px: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Checkbox
        checked={selected}
        onChange={(e) => onSelect(word.id, e.target.checked)}
        size="small"
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight="bold" noWrap>
          {word.wordHr}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {word.translation}
        </Typography>
      </Box>

      <Box sx={{ width: 120, textAlign: 'center' }}>
        {word.collectionName ? (
          <Chip label={word.collectionName} size="small" variant="outlined" />
        ) : null}
      </Box>

      <Box sx={{ width: 100, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {word.isLearned ? (
          <Chip
            label={t('exercises.learnWords.learned')}
            size="small"
            color="success"
            sx={{ fontSize: '0.65rem' }}
          />
        ) : (
          <>
            <LinearProgress
              variant="determinate"
              value={word.progressPercent}
              sx={{ flex: 1, height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 30 }}>
              {word.progressPercent}%
            </Typography>
          </>
        )}
      </Box>

      <IconButton
        size="small"
        onClick={() => onEdit(word)}
        aria-label={t('dictionary.editWordModal.title')}
      >
        <Edit fontSize="small" />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => speakWord(word.wordHr)}
        aria-label={t('dictionary.listen')}
      >
        <VolumeUp fontSize="small" />
      </IconButton>

      <IconButton size="small" onClick={() => onDelete(word)} aria-label={t('dictionary.delete')}>
        <Delete fontSize="small" />
      </IconButton>
    </Box>
  );
}
