import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import type { DictionaryPracticeItem } from '@cro/shared';

import type { Phase } from './useSpeedQuiz';

interface SpeedQuizCardProps {
  item: DictionaryPracticeItem;
  options: string[];
  phase: Phase;
  selectedAnswer: string | null;
  timeLeft: number;
  timerColor: string;
  onAnswer: (answer: string) => void;
}

export function SpeedQuizCard({
  item,
  options,
  phase,
  selectedAnswer,
  timeLeft,
  timerColor,
  onAnswer,
}: SpeedQuizCardProps) {
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: timerColor }}>
            {timeLeft}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {t('exercises.letterPick.instruction')}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {item.wordHr}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {options.map((opt) => {
            const isCorrectOpt = opt === item.translation;
            const isWrongSelected = phase === 'result' && opt === selectedAnswer && !isCorrectOpt;
            const isHighlightCorrect = phase === 'result' && isCorrectOpt;

            return (
              <Button
                key={opt}
                fullWidth
                variant="outlined"
                disabled={phase === 'result'}
                onClick={() => onAnswer(opt)}
                sx={{
                  py: 1.5,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  ...(isHighlightCorrect && {
                    bgcolor: '#e8f5e9',
                    borderColor: '#66bb6a',
                    color: '#2e7d32',
                    '&.Mui-disabled': {
                      bgcolor: '#e8f5e9',
                      borderColor: '#66bb6a',
                      color: '#2e7d32',
                    },
                  }),
                  ...(isWrongSelected && {
                    bgcolor: '#ffebee',
                    borderColor: '#ef9a9a',
                    color: '#c62828',
                    '&.Mui-disabled': {
                      bgcolor: '#ffebee',
                      borderColor: '#ef9a9a',
                      color: '#c62828',
                    },
                  }),
                }}
              >
                {opt}
              </Button>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
