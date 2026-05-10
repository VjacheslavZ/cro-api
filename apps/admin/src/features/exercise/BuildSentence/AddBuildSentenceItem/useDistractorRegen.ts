import { useEffect, useRef, useState } from 'react';
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

import type { BuildSentenceFormData } from '../schema.ts';
import { apiClient } from '../../../../api/client.ts';

const DEFAULT_REGEN_PROMPT =
  'Generate exactly 5 Croatian words similar to the given word without duplicates.\nRules:\n- Same part of speech (verb→verbs, noun→nouns, etc.)\n- Similar meaning OR commonly confused alternatives\n- Do NOT include the original word\n- No duplicates\nReturn ONLY a valid JSON array of 5 strings: {words: ["word1","word2","word3","word4","word5"]}';

export function useDistractorRegen(
  topicId: string,
  getValues: UseFormGetValues<BuildSentenceFormData>,
  setValue: UseFormSetValue<BuildSentenceFormData>,
) {
  const regenPromptKey = `bsa_regen_prompt_${topicId}`;

  const [regenPrompt, setRegenPrompt] = useState(
    () => localStorage.getItem(regenPromptKey) ?? DEFAULT_REGEN_PROMPT,
  );
  const [regeneratingPositions, setRegeneratingPositions] = useState<Set<number>>(new Set());

  const regenPromptRef = useRef(regenPrompt);
  regenPromptRef.current = regenPrompt;

  useEffect(() => {
    localStorage.setItem(regenPromptKey, regenPrompt);
  }, [regenPromptKey, regenPrompt]);

  const handleRegenerate = async (position: number, wordHr: string) => {
    setRegeneratingPositions((prev) => new Set(prev).add(position));
    try {
      const { data: raw } = await apiClient.post<{ response: string }>('/admin/llm/generate', {
        prompt: `Word: "${wordHr}"\n\n${regenPromptRef.current}`,
        options: { temperature: 1, top_p: 0.9, repeat_penalty: 1.5 },
      });
      const parsed: unknown = JSON.parse(raw.response);

      let distractors: string[];
      if (Array.isArray(parsed)) {
        distractors = (parsed as string[]).slice(0, 5);
      } else if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'words' in parsed &&
        Array.isArray((parsed as { words: unknown }).words)
      ) {
        distractors = (parsed as { words: string[] }).words.slice(0, 5);
      } else {
        throw new Error('Unexpected response format');
      }

      const currentWords = getValues('words');
      const wordIndex = currentWords.findIndex((w) => w.position === position);
      if (wordIndex !== -1) {
        setValue(`words.${wordIndex}.distractors`, distractors, { shouldValidate: true });
      }
    } catch {
      // silently ignore — user can retry
    } finally {
      setRegeneratingPositions((prev) => {
        const next = new Set(prev);
        next.delete(position);
        return next;
      });
    }
  };

  return { regenPrompt, setRegenPrompt, regeneratingPositions, handleRegenerate };
}
