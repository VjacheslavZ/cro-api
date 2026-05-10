import { useEffect, useRef } from 'react';
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

  // Keep a ref so the keydown handler always calls the latest closure without
  // needing to be re-registered on every render.
  const onOptionClickRef = useRef(onOptionClick);
  onOptionClickRef.current = onOptionClick;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= options.length) {
        onOptionClickRef.current(options[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]); // re-register only when the actual options slot changes

  return (
    <>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        {t('exercises.buildSentence.wordOf', {
          current: currentWordIndex + 1,
          total: totalWords,
        })}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {options.map((option, index) => (
          <Button
            key={index}
            variant="outlined"
            size="small"
            onClick={() => onOptionClick(option)}
            sx={{ textTransform: 'none', fontWeight: 500, gap: 0.75 }}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                border: '1px solid',
                borderColor: 'inherit',
                borderRadius: '3px',
                fontSize: 10,
                lineHeight: 1,
                opacity: 0.55,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </Box>
            {option}
          </Button>
        ))}
      </Box>
    </>
  );
}
