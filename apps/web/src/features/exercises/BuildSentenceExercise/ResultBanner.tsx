import { useTranslation } from 'react-i18next';
import { CircleCheckIcon, CircleXIcon, RotateCcwIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  phase: 'correct' | 'incorrect';
  correctSentence: string;
  onRetry: () => void;
}

export function ResultBanner({ phase, correctSentence, onRetry }: Props) {
  const { t } = useTranslation();

  if (phase === 'correct') {
    return (
      <Alert className="mt-2 border-green-500 text-green-800">
        <CircleCheckIcon />
        <AlertTitle>{t('exercises.buildSentence.correct')}</AlertTitle>
      </Alert>
    );
  }

  return (
    <>
      <Alert variant="destructive" className="mt-2 mb-4">
        <CircleXIcon />
        <AlertTitle>{t('exercises.buildSentence.incorrect')}</AlertTitle>
        <AlertDescription className="font-semibold">{correctSentence}</AlertDescription>
      </Alert>
      <Button className="mt-2" onClick={onRetry}>
        <RotateCcwIcon data-icon="inline-start" />
        {t('exercises.buildSentence.tryAgain')}
      </Button>
    </>
  );
}
