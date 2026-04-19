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
} from '@mui/material';
import { Add, FitnessCenter } from '@mui/icons-material';

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
    <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 170 }}>
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
        sx={{ flex: 1, minWidth: 180 }}
      />
      <Button variant="contained" startIcon={<Add />} onClick={onAddWord}>
        {t('dictionary.addWord')}
      </Button>
      <Button
        variant="outlined"
        startIcon={<FitnessCenter />}
        onClick={onStartPractice}
        disabled={practiceDisabled}
      >
        {t('dictionary.practice.start')}
      </Button>
      <FormControlLabel
        sx={{ ml: 0.5, whiteSpace: 'nowrap' }}
        control={
          <Checkbox
            size="small"
            checked={hideLearned}
            onChange={(e) => onHideLearnedChange(e.target.checked)}
          />
        }
        label={t('dictionary.hideLearned')}
      />
    </Box>
  );
}
