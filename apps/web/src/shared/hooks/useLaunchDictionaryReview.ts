import { useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';

import { useStartDictionaryReview } from '@/api/dictionary.ts';

/**
 * Starts an FSRS revision session and navigates to it, tracking loading/error
 * state along the way. Shared between VocabularyPage and HomePage entry points.
 */
export function useLaunchDictionaryReview(backPath: string) {
  const navigate = useNavigate();
  const startReview = useStartDictionaryReview();
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState(false);

  const launch = async () => {
    setError(false);
    startTransition(async () => {
      try {
        const result = await startReview.mutateAsync({});
        startTransition(() => {
          navigate(`/dictionary/review/${result.sessionId}`, {
            state: {
              items: result.items,
              totalQuestions: result.totalQuestions,
              backPath,
            },
          });
        });
      } catch {
        setError(true);
      }
    });
  };

  return { launch, loading, error };
}
