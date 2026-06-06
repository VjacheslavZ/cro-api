/**
 * @module useLlmTranslation
 * @description Fires POST /admin/llm/generate when debouncedSentence changes (≥2 tokens) to
 * auto-fill translationRu/Uk/En. Skips the call when skipLlmRef is set (used by handleGenerate
 * to prevent double-firing after a full form reset). handleRegenerate is called via ref to avoid
 * adding an unstable function reference to the effect dependency array.
 * @usedBy AddBuildSentenceItem
 */
import { useEffect, useRef, useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import { apiClient } from '../../../../api/client.ts';
import type { BuildSentenceFormData } from '../schema.ts';
import { FIXED_KEY, DEFAULT_FIXED_PROMPT } from '../LLMPromptSection.tsx';
import type { LLMRawResponse } from '../LLMPromptSection.tsx';
import type { BuildSentenceItemData } from '../schema.ts';

interface Params {
  debouncedSentence: string;
  editing: BuildSentenceItemData | null;
  setValue: UseFormSetValue<BuildSentenceFormData>;
  clearDistractorInputs: () => void;
  handleRegenerate: (position: number, wordHr: string) => Promise<void>;
}

export function useLlmTranslation({
  debouncedSentence,
  editing,
  setValue,
  clearDistractorInputs,
  handleRegenerate,
}: Params) {
  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const skipLlmRef = useRef(false);
  const handleRegenerateRef = useRef(handleRegenerate);
  handleRegenerateRef.current = handleRegenerate;

  useEffect(() => {
    if (skipLlmRef.current) {
      skipLlmRef.current = false;
      return;
    }

    const tokens = debouncedSentence.trim().split(/\s+/).filter(Boolean);
    if (tokens.length < 2) return;

    if (editing) {
      const editingSentence = editing.words
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((w) => w.wordHr)
        .join(' ');
      if (debouncedSentence === editingSentence) return;
    }

    setValue(
      'words',
      tokens.map((wordHr, idx) => ({ wordHr, position: idx, distractors: [] })),
      { shouldValidate: true },
    );
    clearDistractorInputs();
    tokens.forEach((wordHr, idx) => void handleRegenerateRef.current(idx, wordHr));

    const fixedPrompt = localStorage.getItem(FIXED_KEY) ?? DEFAULT_FIXED_PROMPT;
    const prompt = `For the following Croatian sentence: "${tokens.join(' ')}"\n\n${fixedPrompt}`;

    setIsLlmLoading(true);
    apiClient
      .post<{ response: string }>('/admin/llm/generate', {
        prompt,
        options: { temperature: 1, top_p: 1, repeat_penalty: 1.2 },
      })
      .then(({ data: raw }) => {
        const data = JSON.parse(raw.response) as LLMRawResponse;
        setValue('translationRu', data.translationRu);
        setValue('translationUk', data.translationUk);
        setValue('translationEn', data.translationEn);
      })
      .catch(() => {})
      .finally(() => setIsLlmLoading(false));
  }, [debouncedSentence, editing, setValue, clearDistractorInputs]);

  return { isLlmLoading, skipLlmRef };
}
