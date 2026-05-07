import { Alert, Button, Typography } from '@mui/material';
import { CheckCircle, ArrowForward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface Props {
  phase: 'correct' | 'incorrect';
  correctSentence: string;
  isLast: boolean;
  onNext: () => void;
}

export function ResultBanner({ phase, correctSentence, isLast, onNext }: Props) {
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
      <Button variant="contained" endIcon={<ArrowForward />} onClick={onNext} sx={{ mt: 1 }}>
        {isLast ? t('exercises.buildSentence.finish') : t('exercises.buildSentence.next')}
      </Button>
    </>
  );
}
