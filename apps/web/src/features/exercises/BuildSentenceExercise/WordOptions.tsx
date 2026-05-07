import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
  currentWordIndex: number;
  totalWords: number;
  options: string[];
  onOptionClick: (option: string) => void;
}

export function WordOptions({ currentWordIndex, totalWords, options, onOptionClick }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        {t('exercises.buildSentence.wordOf', {
          current: currentWordIndex + 1,
          total: totalWords,
        })}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {options.map((option) => (
          <Button
            key={option}
            variant="outlined"
            size="small"
            onClick={() => onOptionClick(option)}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            {option}
          </Button>
        ))}
      </Box>
    </>
  );
}
