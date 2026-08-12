import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useStartDictionaryReview } from '../../api/dictionary';

/**
 * Starts an FSRS revision session and navigates to it, tracking loading/error
 * state along the way. Shared between VocabularyPage and HomePage entry points.
 */
export function useLaunchDictionaryReview(backPath: string) {
  const navigate = useNavigate();
  const startReview = useStartDictionaryReview();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const launch = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await startReview.mutateAsync({});
      navigate(`/dictionary/review/${result.sessionId}`, {
        state: {
          items: result.items,
          totalQuestions: result.totalQuestions,
          backPath,
        },
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return { launch, loading, error };
}
