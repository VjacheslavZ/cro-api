import { Box, Chip, Typography } from '@mui/material';

interface SortedWord {
  wordHr: string;
}

interface Props {
  phase: 'selecting' | 'correct' | 'incorrect';
  selectedWords: string[];
  sortedWords: SortedWord[];
  onUndo?: () => void;
}

export function WordProgressRow({ phase, selectedWords, sortedWords, onUndo }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        minHeight: 40,
        mb: 2,
        p: 1.5,
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: '1px dashed rgba(0,0,0,0.15)',
      }}
    >
      {phase === 'selecting' &&
        selectedWords.map((word, idx) => (
          <Chip
            key={idx}
            label={word}
            size="small"
            sx={{ bgcolor: 'primary.50' }}
            onDelete={idx === selectedWords.length - 1 && onUndo ? onUndo : undefined}
          />
        ))}

      {phase !== 'selecting' &&
        sortedWords.map((correctWord, idx) => {
          const chosen = selectedWords[idx];
          const isWrong = chosen !== correctWord.wordHr;
          return (
            <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isWrong && (
                <Typography
                  variant="caption"
                  sx={{ color: 'success.main', fontWeight: 600, lineHeight: 1.2 }}
                >
                  {correctWord.wordHr}
                </Typography>
              )}
              <Chip
                label={chosen}
                size="small"
                sx={
                  isWrong
                    ? { bgcolor: '#ffebee', color: '#c62828', textDecoration: 'line-through' }
                    : { bgcolor: '#e8f5e9', color: '#2e7d32' }
                }
              />
            </Box>
          );
        })}
    </Box>
  );
}
