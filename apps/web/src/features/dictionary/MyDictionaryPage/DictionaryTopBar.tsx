import { useTranslation } from 'react-i18next';
import { TextField, Button, Box } from '@mui/material';
import { Add, FitnessCenter } from '@mui/icons-material';

/**
 * Top action bar for the My Dictionary page.
 *
 * Used in: MyDictionaryPage.
 *
 * Contains the word search field, "Add Word" button, and "Practice" button.
 * Pressing Enter in a non-empty search field triggers `onSearchEnter` (opens
 * the Add Word modal pre-filled with the search text).
 */
interface DictionaryTopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Called when Enter is pressed in a non-empty search field. */
  onSearchEnter: () => void;
  onAddWord: () => void;
  onStartPractice: () => void;
  /** Disables the Practice button when the word list is empty. */
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
