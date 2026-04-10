import { useTranslation } from 'react-i18next';
import { TextField, Button, Box } from '@mui/material';
import { Add, FitnessCenter } from '@mui/icons-material';

interface DictionaryTopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchEnter: () => void;
  onAddWord: () => void;
  onStartPractice: () => void;
  practiceDisabled: boolean;
}

export function DictionaryTopBar({
  search,
  onSearchChange,
  onSearchEnter,
  onAddWord,
  onStartPractice,
  practiceDisabled,
}: DictionaryTopBarProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        size="small"
        placeholder={t('dictionary.searchPlaceholder')}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && search.trim()) onSearchEnter();
        }}
        sx={{ flex: 1, minWidth: 200 }}
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
    </Box>
  );
}
