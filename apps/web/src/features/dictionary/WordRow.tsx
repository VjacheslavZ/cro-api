import { useTranslation } from 'react-i18next';
import { Box, Checkbox, Chip, IconButton, LinearProgress, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import type { DictionaryWord } from '@cro/shared';

interface WordRowProps {
  word: DictionaryWord;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}

export function WordRow({ word, selected, onSelect, onDelete }: WordRowProps) {
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

      <Box sx={{ width: 80, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={word.progressPercent}
          sx={{ flex: 1, height: 6, borderRadius: 3 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 30 }}>
          {word.progressPercent}%
        </Typography>
      </Box>

      <IconButton
        size="small"
        onClick={() => onDelete(word.id)}
        aria-label={t('dictionary.delete')}
      >
        <Delete fontSize="small" />
      </IconButton>
    </Box>
  );
}
