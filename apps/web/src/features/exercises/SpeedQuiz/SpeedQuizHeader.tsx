import { useTranslation } from 'react-i18next';
import { Box, Typography, Button } from '@mui/material';
import { Timer, Close } from '@mui/icons-material';

interface SpeedQuizHeaderProps {
  doneCount: number;
  totalWords: number;
  onStop: () => void;
}

export function SpeedQuizHeader({ doneCount, totalWords, onStop }: SpeedQuizHeaderProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Timer color="warning" />
        <Typography variant="h6">{t('exercises.vocabulary.speedQuiz')}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('exercises.speedQuiz.progress', { done: doneCount, total: totalWords })}
        </Typography>
        <Button size="small" color="error" startIcon={<Close />} onClick={onStop}>
          {t('exercises.session.stop')}
        </Button>
      </Box>
    </Box>
  );
}
