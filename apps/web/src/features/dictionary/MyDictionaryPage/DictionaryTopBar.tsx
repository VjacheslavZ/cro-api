import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Typography,
} from '@mui/material';
import { Add, FitnessCenter, Search } from '@mui/icons-material';

import type { DictionaryWordSort } from '../../../api/dictionary.ts';

interface DictionaryTopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Called when Enter is pressed in a non-empty search field. */
  onSearchEnter: () => void;
  onAddWord: () => void;
  onStartPractice: () => void;
  /** Disables the Practice button when the word list is empty. */
  practiceDisabled: boolean;
  hideLearned: boolean;
  onHideLearnedChange: (value: boolean) => void;
  sort: DictionaryWordSort;
  onSortChange: (value: DictionaryWordSort) => void;
}

export function DictionaryTopBar({
  search,
  onSearchChange,
  onSearchEnter,
  onAddWord,
  onStartPractice,
  practiceDisabled,
  hideLearned,
  onHideLearnedChange,
  sort,
  onSortChange,
}: DictionaryTopBarProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 3 }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>{t('dictionary.sortBy')}</InputLabel>
        <Select
          value={sort}
          label={t('dictionary.sortBy')}
          onChange={(e) => onSortChange(e.target.value as DictionaryWordSort)}
        >
          <MenuItem value="newest">{t('dictionary.sort.newest')}</MenuItem>
          <MenuItem value="oldest">{t('dictionary.sort.oldest')}</MenuItem>
          <MenuItem value="word">{t('dictionary.sort.word')}</MenuItem>
          <MenuItem value="collection">{t('dictionary.sort.collection')}</MenuItem>
          <MenuItem value="progress">{t('dictionary.sort.progress')}</MenuItem>
        </Select>
      </FormControl>

      <TextField
        size="small"
        placeholder={t('dictionary.searchPlaceholder')}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && search.trim()) onSearchEnter();
        }}
        sx={{ flex: 1, minWidth: 200 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={onAddWord}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {t('dictionary.addWord')}
      </Button>

      <Button
        variant="outlined"
        startIcon={<FitnessCenter />}
        onClick={onStartPractice}
        disabled={practiceDisabled}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {t('dictionary.practice.start')}
      </Button>

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={hideLearned}
            onChange={(e) => onHideLearnedChange(e.target.checked)}
          />
        }
        label={<Typography variant="body2">{t('dictionary.hideLearned')}</Typography>}
        sx={{ m: 0 }}
      />
    </Box>
  );
}
