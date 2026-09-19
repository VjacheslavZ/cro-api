/**
 * @module LearnWordsSessionPage
 * @description Step 3 of the Learn Words flow. Runs 4 sequential exercise steps for the
 * selected words: letter-pick → word-to-translate → translate-to-word → matching.
 * Each step creates its own DictionaryPracticeSession and submits answers before advancing.
 * Steps advance automatically with no inter-step screen. On the final step, dispatches
 * fetchMe() and navigates to LearnWordsResultsPage.
 * IMPORTANT: fetchMe() is called only on the final step — calling it mid-session sets
 * auth.loading = true, which causes AuthGuard to unmount this component and lose all state.
 * Uses isStartingRef to prevent duplicate session starts in React 18 StrictMode.
 * @usedBy AppRouter (/exercises/vocabulary/learn/session)
 */
import { useState, useEffect, useEffectEvent, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from 'cn';
import type {
  DictionaryPracticeItem,
  DictionaryWord,
  FinishDictionaryPracticeResponse,
  VocabularyExerciseType,
} from '@cro/shared';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Spinner } from '@/components/Spinner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { useAppDispatch } from '../../../store';
import { fetchMe } from '../../../api/auth';
import { useStartDictionaryPractice, useFinishDictionaryPractice } from '../../../api/dictionary';
import { TextInputExercise } from '../TextInputExercise/TextInputExercise';
import { LetterPickExercise } from '../LetterPickExercise/LetterPickExercise';
import { MatchingExercise } from '../MatchingExercise/MatchingExercise';

const EXERCISE_ORDER: VocabularyExerciseType[] = [
  'letter-pick',
  'word-to-translate',
  'translate-to-word',
  'matching',
];

interface LocationState {
  words: DictionaryWord[];
  collectionId?: string;
}

type Answer = { wordId: string; givenAnswer: string; isCorrect: boolean };

type Phase = 'loading' | 'exercising';

/**
 * Orchestrates the 4-step Learn Words session with loading and exercising phases.
 * Steps advance automatically — no inter-step screen.
 * Redirects to setup if location state is missing or word list is empty.
 */
export function LearnWordsSessionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const state = (location.state as LocationState) ?? null;

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<DictionaryPracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepAnswers, setStepAnswers] = useState<Answer[]>([]);
  const [allResults, setAllResults] = useState<FinishDictionaryPracticeResponse[]>([]);

  const startSession = useStartDictionaryPractice();
  const finishSession = useFinishDictionaryPractice();

  const wordIds = state?.words.map((w) => w.id) ?? [];
  const exerciseType = EXERCISE_ORDER[step];

  // Guard against concurrent calls (React 18 StrictMode double-effect + rapid double-clicks)
  const isStartingRef = useRef(false);

  // Helper: start a session for a specific step index. State is updated only in
  // promise callbacks so the mount effect below never sets state synchronously.
  const startStepSession = (stepIndex: number) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    startSession
      .mutateAsync({ wordIds, exerciseType: EXERCISE_ORDER[stepIndex] })
      .then((result) => {
        setSessionId(result.sessionId);
        setItems(result.items);
        setCurrentIndex(0);
        setStepAnswers([]);
        setPhase('exercising');
      })
      .catch(() => {
        // Error handled by startSession.isError
      })
      .finally(() => {
        isStartingRef.current = false;
      });
  };

  // Start the first session on mount. `phase` is already 'loading' initially, so no
  // setState is needed here; an effect event lets the effect read the latest closure
  // without listing it as a dependency.
  const startFirstSession = useEffectEvent(() => {
    if (wordIds.length === 0) return;
    startStepSession(0);
  });

  useEffect(() => {
    startFirstSession();
  }, []);

  const handleStepComplete = async (answers: Answer[]) => {
    if (!sessionId) return;
    try {
      const result = await finishSession.mutateAsync({
        sessionId,
        answers,
        exerciseType,
      });

      const updated = [...allResults, result];
      setAllResults(updated);

      if (step === EXERCISE_ORDER.length - 1) {
        // Refresh user XP/streak only on the final step, just before navigating away.
        // Calling fetchMe() on intermediate steps sets auth.loading = true, which causes
        // AuthGuard to unmount this component and lose all exercise state.
        dispatch(fetchMe());
        navigate('/exercises/vocabulary/learn/results', {
          state: { allResults: updated, collectionId: state?.collectionId },
          replace: true,
        });
      } else {
        const nextStep = step + 1;
        setStep(nextStep);
        setPhase('loading');
        startStepSession(nextStep);
      }
    } catch {
      // Error handled by mutation state
    }
  };

  const handleAnswer = (answer: { itemId: string; givenAnswer: string; isCorrect: boolean }) => {
    const a: Answer = {
      wordId: answer.itemId,
      givenAnswer: answer.givenAnswer,
      isCorrect: answer.isCorrect,
    };
    const updated = [...stepAnswers, a];
    setStepAnswers(updated);

    if (currentIndex + 1 >= items.length) {
      void handleStepComplete(updated);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (!state || wordIds.length === 0) {
    navigate('/exercises/vocabulary/learn', { replace: true });
    return null;
  }

  // Step indicator chips
  const stepIndicator = (
    <div className="mb-4 flex flex-wrap gap-2">
      {EXERCISE_ORDER.map((_, i) => (
        <Badge
          key={i}
          variant={i === step ? 'default' : 'outline'}
          className={cn(
            'min-w-6 justify-center tabular-nums',
            i < step && 'border-success text-success',
          )}
        >
          {i + 1}
        </Badge>
      ))}
    </div>
  );

  if (phase === 'loading') {
    return (
      <PageContainer size="sm" className="flex justify-center py-8">
        <Spinner />
      </PageContainer>
    );
  }

  if (items.length === 0) {
    return (
      <PageContainer size="sm" className="py-8">
        <ErrorAlert />
      </PageContainer>
    );
  }

  // Matching — bulk completion
  if (exerciseType === 'matching') {
    return (
      <PageContainer size="md" className="py-8">
        {stepIndicator}
        <p className="mb-4 text-sm text-muted-foreground">
          {t('exercises.learnWords.exerciseStep', { step: step + 1 })}
        </p>
        {(startSession.isError || finishSession.isError) && <ErrorAlert className="mb-4" />}
        <MatchingExercise
          items={items}
          onComplete={(answers) =>
            handleStepComplete(
              answers.map((a) => ({
                wordId: a.wordId,
                givenAnswer: a.givenAnswer,
                isCorrect: a.isCorrect,
              })),
            )
          }
        />
      </PageContainer>
    );
  }

  // Sequential exercises (letter-pick, word-to-translate, translate-to-word)
  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;
  const reverseDirection = exerciseType === 'translate-to-word';

  const prompt = reverseDirection ? currentItem.translation : currentItem.wordHr;
  const correctAnswer = reverseDirection ? currentItem.wordHr : currentItem.translation;

  return (
    <PageContainer size="sm" className="py-8">
      {stepIndicator}
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>{t('exercises.learnWords.exerciseStep', { step: step + 1 })}</span>
        <span>
          {t('exercises.session.progress', { current: currentIndex + 1, total: items.length })}
        </span>
      </div>
      <Progress
        value={progress}
        aria-label={t('exercises.session.progress', {
          current: currentIndex + 1,
          total: items.length,
        })}
        className="mb-6 **:data-[slot=progress-track]:h-2"
      />

      {(startSession.isError || finishSession.isError) && <ErrorAlert className="mb-4" />}

      {exerciseType === 'letter-pick' && (
        <LetterPickExercise
          key={currentItem.wordId}
          itemId={currentItem.wordId}
          wordHr={currentItem.wordHr}
          translation={currentItem.translation}
          wordToSpeak={currentItem.wordHr}
          onAnswer={handleAnswer}
        />
      )}

      {exerciseType !== 'letter-pick' && (
        <TextInputExercise
          key={currentItem.wordId}
          itemId={currentItem.wordId}
          correctAnswer={correctAnswer}
          placeholder={
            reverseDirection
              ? t('dictionary.practice.translatePlaceholder')
              : t('dictionary.practice.placeholder')
          }
          wordToSpeak={currentItem.wordHr}
          prompt={
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {reverseDirection
                  ? t('dictionary.practice.translateInstruction')
                  : t('dictionary.practice.instruction')}
              </p>
              <p className="mt-2 text-2xl">{prompt}</p>
            </div>
          }
          correctMessage={t('dictionary.practice.correct')}
          incorrectMessage={t('dictionary.practice.incorrect', { answer: correctAnswer })}
          onAnswer={handleAnswer}
        />
      )}
    </PageContainer>
  );
}
