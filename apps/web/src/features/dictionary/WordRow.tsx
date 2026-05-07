import { useTranslation } from 'react-i18next';
import { Box, Checkbox, Chip, IconButton, LinearProgress, Typography } from '@mui/material';
import { Delete, Edit, Refresh, School, VolumeUp } from '@mui/icons-material';
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
  onEdit: (word: DictionaryWord) => void;
  onDelete: (word: DictionaryWord) => void;
  onMarkLearned: (word: DictionaryWord) => void;
  onResetProgress: (word: DictionaryWord) => void;
}

export function WordRow({
  word,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onMarkLearned,
  onResetProgress,
}: WordRowProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1.5,
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 1.5,
        bgcolor: 'white',
        '&:hover': { bgcolor: 'grey.50' },
        transition: 'background-color 0.1s ease',
      }}
    >
      <Checkbox
        checked={selected}
        onChange={(e) => onSelect(word.id, e.target.checked)}
        size="small"
        sx={{ p: 0.5, flexShrink: 0 }}
      />

      {/* Word + translation */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#111827' }}>
          {word.wordHr}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {word.translation}
        </Typography>
      </Box>

      {/* Collection */}
      <Box sx={{ width: 140, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}>
          {word.collectionName || '—'}
        </Typography>
      </Box>

      {/* Progress */}
      <Box sx={{ width: 150, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        {word.isLearned ? (
          <Chip
            label={t('exercises.learnWords.learned')}
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        ) : (
          <>
            <LinearProgress
              variant="determinate"
              value={word.progressPercent}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': { borderRadius: 3 },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ minWidth: 30, textAlign: 'right' }}
            >
              {word.progressPercent}%
            </Typography>
          </>
        )}
      </Box>

      {/* Actions: MarkLearned → ResetProgress → Edit → Listen → Delete */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <IconButton
          size="small"
          onClick={() => onMarkLearned(word)}
          aria-label={t('dictionary.markLearned')}
          title={t('dictionary.markLearned')}
          sx={{ visibility: word.isLearned ? 'hidden' : 'visible' }}
        >
          <School sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onResetProgress(word)}
          aria-label={t('dictionary.resetProgress')}
          title={t('dictionary.resetProgress')}
          sx={{ visibility: word.progressPercent > 0 ? 'visible' : 'hidden' }}
        >
          <Refresh sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onEdit(word)}
          aria-label={t('dictionary.editWordModal.title')}
        >
          <Edit sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => speakWord(word.wordHr)}
          aria-label={t('dictionary.listen')}
        >
          <VolumeUp sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDelete(word)}
          aria-label={t('dictionary.delete')}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
