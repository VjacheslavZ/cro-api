import { useCallback } from 'react';

import { useAppSelector } from '../../store';
import { speakWord } from '../lib/speech';

export function useSpeech() {
  const speechEnabled = useAppSelector((state) => state.preferences.speechEnabled);

  const speak = useCallback(
    (text: string) => {
      if (!speechEnabled) return;
      speakWord(text);
    },
    [speechEnabled],
  );

  return { speak };
}
