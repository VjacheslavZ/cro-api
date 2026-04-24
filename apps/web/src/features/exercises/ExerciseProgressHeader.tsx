import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, LinearProgress, Paper } from '@mui/material';
import { ArrowBack, MenuBook } from '@mui/icons-material';

interface ExerciseProgressHeaderProps {
  currentIndex: number;
  total: number;
  onStop: () => void;
  onShowRules?: () => void;
}

export function ExerciseProgressHeader({
  currentIndex,
  total,
  onStop,
  onShowRules,
}: ExerciseProgressHeaderProps) {
  const { t } = useTranslation();
  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, p: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" variant="text" startIcon={<ArrowBack />} onClick={onStop}>
            {t('exercises.session.stop')}
          </Button>
          {onShowRules && (
            <Button size="small" variant="text" startIcon={<MenuBook />} onClick={onShowRules}>
              {t('exercises.rules.show')}
            </Button>
          )}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {currentIndex + 1} / {total}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'rgba(0,0,0,0.08)',
          '& .MuiLinearProgress-bar': { bgcolor: '#0f172a' },
        }}
      />
    </Paper>
  );
}
