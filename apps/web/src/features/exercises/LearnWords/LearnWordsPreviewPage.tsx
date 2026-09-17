/**
 * @module LearnWordsPreviewPage
 * @description Step 2 of the Learn Words flow. Shows words one at a time (Croatian + translation)
 * and speaks each word via useSpeech on display. User pages through all words before starting
 * the exercise session. On the last word, "Next" navigates to LearnWordsSessionPage.
 * @usedBy AppRouter (/exercises/vocabulary/learn/preview)
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DictionaryWord } from '@cro/shared';
import { XIcon } from 'lucide-react';
import { cn } from 'cn';

import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';

import { useSpeech } from '../../../shared/hooks/useSpeech';
import { StopExerciseDialog } from '../StopExerciseDialog';

interface LocationState {
  words: DictionaryWord[];
  collectionId?: string;
}

/**
 * Renders the word preview carousel with speech and progress dots.
 * Redirects to setup page if location state is missing (direct URL access or empty word list).
 */
export function LearnWordsPreviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { words, collectionId } = (location.state as LocationState) ?? {};

  const [index, setIndex] = useState(0);
  const [stopOpen, setStopOpen] = useState(false);
  const { speak } = useSpeech();

  useEffect(() => {
    if (words?.[index]?.wordHr) speak(words[index].wordHr);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [index]);

  if (!words || words.length === 0) {
    navigate('/exercises/vocabulary/learn', { replace: true });
    return null;
  }

  const current = words[index];
  const isLast = index === words.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/exercises/vocabulary/learn/session', {
        state: { words, collectionId },
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <PageContainer size="sm" className="py-8">
      <Button
        variant="ghost"
        className="mb-4 text-destructive hover:text-destructive"
        onClick={() => setStopOpen(true)}
      >
        <XIcon data-icon="inline-start" />
        {t('exercises.session.stop')}
      </Button>

      <StopExerciseDialog
        open={stopOpen}
        onClose={() => setStopOpen(false)}
        onConfirm={() => navigate(-1)}
      />

      <h1 className="mb-2 text-2xl font-semibold">{t('exercises.learnWords.previewTitle')}</h1>

      {/* Progress dots */}
      <div className="mb-6 flex flex-wrap gap-1" aria-hidden="true">
        {words.map((_, i) => (
          <span
            key={i}
            className={cn(
              'size-2 rounded-full',
              i === index ? 'bg-primary' : i < index ? 'bg-primary/40' : 'bg-neutral-300',
            )}
          />
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {t('exercises.learnWords.wordOf', { current: index + 1, total: words.length })}
      </p>

      <div className="flex min-h-45 flex-col justify-center gap-4 rounded-xl bg-card p-8 text-center shadow-md ring-1 ring-foreground/10">
        <p className="text-4xl font-bold">{current.wordHr}</p>
        <p className="text-2xl text-muted-foreground">{current.translation}</p>
      </div>

      <div className="mt-6">
        <Button size="lg" className="w-full" onClick={handleNext}>
          {isLast ? t('exercises.learnWords.startExercises') : t('exercises.learnWords.next')}
        </Button>
      </div>
    </PageContainer>
  );
}
