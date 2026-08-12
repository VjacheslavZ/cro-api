import { Alert, Button, Typography } from '@mui/material';
import { CheckCircle, Replay } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface Props {
  phase: 'correct' | 'incorrect';
  correctSentence: string;
  onRetry: () => void;
}

export function ResultBanner({ phase, correctSentence, onRetry }: Props) {
  const { t } = useTranslation();

  if (phase === 'correct') {
    return (
      <Alert icon={<CheckCircle />} severity="success" sx={{ mt: 1 }}>
        {t('exercises.buildSentence.correct')}
      </Alert>
    );
  }

  return (
    <>
      <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
        {t('exercises.buildSentence.incorrect')}
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
          {correctSentence}
        </Typography>
      </Alert>
      <Button variant="contained" startIcon={<Replay />} onClick={onRetry} sx={{ mt: 1 }}>
        {t('exercises.buildSentence.tryAgain')}
      </Button>
    </>
  );
}
