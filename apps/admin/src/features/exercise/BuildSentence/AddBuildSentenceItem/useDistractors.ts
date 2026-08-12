import { useCallback, useState } from 'react';
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

import type { BuildSentenceFormData } from '../schema.ts';

export function useDistractors(
  watch: UseFormWatch<BuildSentenceFormData>,
  setValue: UseFormSetValue<BuildSentenceFormData>,
) {
  const [distractorInputs, setDistractorInputs] = useState<Record<number, string>>({});

  const addDistractor = useCallback(
    (position: number) => {
      const input = (distractorInputs[position] ?? '').trim();
      if (!input) return;
      const currentWords = watch('words');
      setValue(
        'words',
        currentWords.map((w) =>
          w.position === position && !w.distractors.includes(input)
            ? { ...w, distractors: [...w.distractors, input] }
            : w,
        ),
        { shouldValidate: true },
      );
      setDistractorInputs((prev) => ({ ...prev, [position]: '' }));
    },
    [distractorInputs, watch, setValue],
  );

  const removeDistractor = useCallback(
    (position: number, distractorIndex: number) => {
      setValue(
        'words',
        watch('words').map((w) =>
          w.position === position
            ? { ...w, distractors: w.distractors.filter((_, i) => i !== distractorIndex) }
            : w,
        ),
        { shouldValidate: true },
      );
    },
    [watch, setValue],
  );

  const clearDistractorInputs = useCallback(() => setDistractorInputs({}), []);

  return {
    distractorInputs,
    setDistractorInputs,
    addDistractor,
    removeDistractor,
    clearDistractorInputs,
  };
}
