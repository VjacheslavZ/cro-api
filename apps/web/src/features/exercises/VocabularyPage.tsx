/**
 * @module VocabularyPage
 * @description Vocabulary exercises hub. Offers the "Learn Words" guided flow and four
 * individual practice modes (word-to-translate, translate-to-word, letter-pick, matching).
 * Each mode starts a DictionaryPracticeSession and navigates to DictionaryPracticePage.
 * @usedBy AppRouter (/exercises/vocabulary)
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import {
  ArrowRightIcon,
  EarIcon,
  Grid3x3Icon,
  GraduationCapIcon,
  LanguagesIcon,
  RefreshCwIcon,
  TimerIcon,
  TriangleAlertIcon,
  TypeIcon,
} from 'lucide-react';
import { cn } from 'cn';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Spinner } from '@/components/Spinner';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { useStartDictionaryPractice, useDictionaryReviewDueCount } from '../../api/dictionary';
import { useLaunchDictionaryReview } from '../../shared/hooks/useLaunchDictionaryReview.ts';

type ExerciseDirection = 'word-to-translate' | 'translate-to-word' | 'letter-pick' | 'matching';

const SESSION_WORD_COUNT = 10;

type ModeTone = 'blue' | 'amber' | 'teal' | 'neutral';

/** Border / background / icon colours for the featured (tinted) and plain mode cards. */
const toneClass: Record<ModeTone, { card: string; disc: string; accent: string }> = {
  blue: {
    card: 'border-2 border-blue-200 bg-blue-50 enabled:hover:border-blue-300',
    disc: 'bg-blue-100',
    accent: 'text-primary',
  },
  amber: {
    card: 'border-2 border-amber-200 bg-amber-50 enabled:hover:border-amber-400',
    disc: 'bg-amber-100',
    accent: 'text-amber-600',
  },
  teal: {
    card: 'border-2 border-teal-200 bg-teal-50 enabled:hover:border-teal-300',
    disc: 'bg-teal-100',
    accent: 'text-teal-600',
  },
  neutral: {
    card: 'border bg-card enabled:hover:border-blue-300',
    disc: 'bg-muted',
    accent: 'text-muted-foreground',
  },
};

interface ModeCardProps {
  tone: ModeTone;
  icon: ReactNode;
  title: ReactNode;
  description: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/** One clickable row on the vocabulary hub: icon disc, title, description, arrow. */
function ModeCard({ tone, icon, title, description, loading, disabled, onClick }: ModeCardProps) {
  const tones = toneClass[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-6 rounded-xl p-6 text-left transition-[box-shadow,border-color] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:hover:shadow-lg disabled:cursor-default',
        tones.card,
        disabled && !loading && 'opacity-60',
      )}
    >
      <div
        className={cn(
          'flex size-16 shrink-0 items-center justify-center rounded-xl [&_svg]:size-8',
          tones.disc,
          tones.accent,
        )}
      >
        {loading ? <Spinner className="text-current" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2 text-lg font-semibold text-foreground">
          {title}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRightIcon className={cn('size-6 shrink-0', tones.accent)} />
    </button>
  );
}

export function VocabularyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const startPractice = useStartDictionaryPractice();
  const { data: reviewDueCount } = useDictionaryReviewDueCount();
  const {
    launch: handleStartReview,
    loading: reviewLoading,
    error: reviewError,
  } = useLaunchDictionaryReview('/exercises/vocabulary');
  const [pendingDirection, setPendingDirection] = useState<ExerciseDirection | null>(null);
  const [speedQuizLoading, setSpeedQuizLoading] = useState(false);
  const [speedQuizError, setSpeedQuizError] = useState(false);

  const handleStartSpeedQuiz = async () => {
    setSpeedQuizLoading(true);
    setSpeedQuizError(false);
    try {
      const result = await startPractice.mutateAsync({ learnedOnly: true });
      navigate('/exercises/vocabulary/speed-quiz', {
        state: {
          items: result.items,
          totalQuestions: result.totalQuestions,
          sessionId: result.sessionId,
        },
      });
    } catch {
      setSpeedQuizError(true);
    } finally {
      setSpeedQuizLoading(false);
    }
  };

  const handleStart = async (direction: ExerciseDirection) => {
    setPendingDirection(direction);
    try {
      const result = await startPractice.mutateAsync({ count: SESSION_WORD_COUNT });
      navigate(`/dictionary/practice/${result.sessionId}`, {
        state: {
          items: result.items,
          totalQuestions: result.totalQuestions,
          direction,
          backPath: '/exercises/vocabulary',
        },
      });
    } catch {
      // Error handled by mutation state
    } finally {
      setPendingDirection(null);
    }
  };

  const exercises: {
    direction: ExerciseDirection;
    icon: ReactNode;
    titleKey: string;
    descKey: string;
  }[] = [
    {
      direction: 'word-to-translate',
      icon: <LanguagesIcon className="text-primary" />,
      titleKey: 'exercises.vocabulary.wordToTranslate',
      descKey: 'exercises.vocabulary.wordToTranslateDesc',
    },
    {
      direction: 'translate-to-word',
      icon: <TypeIcon className="text-purple-600" />,
      titleKey: 'exercises.vocabulary.translateToWord',
      descKey: 'exercises.vocabulary.translateToWordDesc',
    },
    {
      direction: 'letter-pick',
      icon: <Grid3x3Icon className="text-success" />,
      titleKey: 'exercises.vocabulary.letterPick',
      descKey: 'exercises.vocabulary.letterPickDesc',
    },
    {
      direction: 'matching',
      icon: <EarIcon className="text-amber-600" />,
      titleKey: 'exercises.vocabulary.matching',
      descKey: 'exercises.vocabulary.matchingDesc',
    },
  ];

  const anyPending = speedQuizLoading || pendingDirection !== null;

  return (
    <PageContainer size="md" className="py-12">
      <div className="mx-auto max-w-3xl">
        {/* Page header */}
        <h1 className="mb-1 text-3xl font-bold text-foreground">
          {t('exercises.vocabulary.title')}
        </h1>
        <p className="mb-8 text-muted-foreground">{t('exercises.vocabulary.subtitle')}</p>

        {startPractice.isError && !speedQuizError && (
          <ErrorAlert message={t('dictionary.practice.noWords')} className="mb-4" />
        )}
        {speedQuizError && (
          <Alert className="mb-4 border-amber-300 text-amber-800">
            <TriangleAlertIcon />
            <AlertTitle>{t('exercises.speedQuiz.notEnoughWords')}</AlertTitle>
          </Alert>
        )}
        {reviewError && (
          <Alert className="mb-4 border-amber-300 text-amber-800">
            <TriangleAlertIcon />
            <AlertTitle>{t('dictionary.review.noWordsDue')}</AlertTitle>
          </Alert>
        )}

        <div className="flex flex-col gap-4">
          {/* Featured: Learn Words */}
          <ModeCard
            tone="blue"
            icon={<GraduationCapIcon />}
            title={t('exercises.vocabulary.learnWords')}
            description={t('exercises.vocabulary.learnWordsDesc')}
            onClick={() =>
              navigate(
                `/exercises/vocabulary/learn${collectionId ? `?collectionId=${collectionId}` : ''}`,
              )
            }
          />

          {/* Featured: Speed Quiz */}
          <ModeCard
            tone="amber"
            icon={<TimerIcon />}
            title={t('exercises.vocabulary.speedQuiz')}
            description={t('exercises.vocabulary.speedQuizDesc')}
            loading={speedQuizLoading}
            disabled={anyPending}
            onClick={handleStartSpeedQuiz}
          />

          {/* Featured: Revision (FSRS) */}
          <ModeCard
            tone="teal"
            icon={<RefreshCwIcon />}
            title={
              <>
                {t('exercises.vocabulary.revision')}
                {!!reviewDueCount && (
                  <Badge className="bg-teal-600 font-bold text-white">{reviewDueCount}</Badge>
                )}
              </>
            }
            description={t('exercises.vocabulary.revisionDesc')}
            loading={reviewLoading}
            disabled={reviewLoading}
            onClick={handleStartReview}
          />

          {/* Section label */}
          <p className="mt-2 mb-1 text-[0.7rem] font-bold tracking-wider text-muted-foreground uppercase">
            {t('exercises.vocabulary.practiceModesLabel')}
          </p>

          {/* Individual practice modes */}
          {exercises.map(({ direction, icon, titleKey, descKey }) => (
            <ModeCard
              key={direction}
              tone="neutral"
              icon={icon}
              title={t(titleKey)}
              description={t(descKey)}
              loading={pendingDirection === direction}
              disabled={pendingDirection !== null}
              onClick={() => handleStart(direction)}
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
