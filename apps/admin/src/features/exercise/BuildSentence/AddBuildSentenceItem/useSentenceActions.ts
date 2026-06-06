/**
 * @module useSentenceActions
 * @description Encapsulates duplicate-check, sentence-blur, and LLM-generate handlers for
 * the Build-a-Sentence form. Owns isCheckingDuplicate state. checkDuplicate is intentionally
 * internal — callers use handleSentenceBlur and handleGenerate.
 * @usedBy AddBuildSentenceItem
 */
import { useState } from 'react';
import type {
  UseFormClearErrors,
  UseFormReset,
  UseFormSetError,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import { apiClient } from '../../../../api/client.ts';
import type { BuildSentenceFormData, BuildSentenceItemData } from '../schema.ts';
import type { GeneratedSentenceData } from '../LLMPromptSection.tsx';

interface Params {
  topicId: string;
  editing: BuildSentenceItemData | null;
  watch: UseFormWatch<BuildSentenceFormData>;
  setValue: UseFormSetValue<BuildSentenceFormData>;
  reset: UseFormReset<BuildSentenceFormData>;
  setError: UseFormSetError<BuildSentenceFormData>;
  clearErrors: UseFormClearErrors<BuildSentenceFormData>;
  setDistractorInputs: Dispatch<SetStateAction<Record<number, string>>>;
  clearDistractorInputs: () => void;
  skipLlmRef: MutableRefObject<boolean>;
  handleRegenerate: (position: number, wordHr: string) => Promise<void>;
}

export function useSentenceActions({
  topicId,
  editing,
  watch,
  setValue,
  reset,
  setError,
  clearErrors,
  setDistractorInputs,
  clearDistractorInputs,
  skipLlmRef,
  handleRegenerate,
}: Params) {
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const checkDuplicate = async (sentence: string) => {
    clearErrors('sentenceHr');
    setIsCheckingDuplicate(true);
    try {
      const params = new URLSearchParams({ sentence });
      if (editing?.id) params.set('excludeId', editing.id);
      const { data } = await apiClient.get(
        `/admin/topics/${topicId}/build-sentence-items/check?${params}`,
      );
      if (data.exists) {
        setError('sentenceHr', { message: 'This sentence already exists in this topic' });
      }
    } catch {
      // ignore check failure — don't block saving
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleSentenceBlur = async () => {
    const sentenceHr = watch('sentenceHr');
    const tokens = sentenceHr.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return;
    const currentWords = watch('words');
    setValue(
      'words',
      tokens.map((token, idx) => ({
        wordHr: token,
        position: idx,
        distractors: currentWords.find((w) => w.position === idx)?.distractors ?? [],
      })),
      { shouldValidate: true },
    );
    setDistractorInputs({});
    await checkDuplicate(tokens.join(' '));
  };

  const handleGenerate = (data: GeneratedSentenceData) => {
    skipLlmRef.current = true;
    reset({
      sentenceHr: data.sentenceHr,
      translationRu: data.translationRu,
      translationUk: data.translationUk,
      translationEn: data.translationEn,
      sortOrder: 0,
      words: data.words,
    });
    clearDistractorInputs();
    void checkDuplicate(data.sentenceHr);
    data.words.forEach((w) => void handleRegenerate(w.position, w.wordHr));
  };

  return { isCheckingDuplicate, handleSentenceBlur, handleGenerate };
}
