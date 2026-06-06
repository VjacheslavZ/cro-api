/**
 * @module AddBuildSentenceItem
 * @description Create/edit form for a single Build-a-Sentence item. Coordinates word-slot
 * parsing, per-word distractor generation via LLM, sentence translation auto-fill, and
 * duplicate checking. Resets to the editing item's values whenever the editing prop changes.
 * @usedBy BuildSentencePage
 */
import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Divider, Paper } from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { buildSentenceSchema, defaultValues } from '../schema.ts';
import type { BuildSentenceFormData, BuildSentenceItemData } from '../schema.ts';
import { SentenceFields } from '../SentenceFields.tsx';
import { LLMPromptSection } from '../LLMPromptSection.tsx';
import { useDistractors } from './useDistractors.ts';
import { useDistractorRegen } from './useDistractorRegen.ts';
import { useLlmTranslation } from './useLlmTranslation.ts';
import { useSentenceActions } from './useSentenceActions.ts';
import { WordSlotsSection } from './WordSlotsSection.tsx';

export type { BuildSentenceFormData, BuildSentenceItemData };

interface Props {
  topicId: string;
  editing: BuildSentenceItemData | null;
  isPending: boolean;
  onSubmit: (data: BuildSentenceFormData) => Promise<void>;
}

/**
 * Create/edit form for a single Build-a-Sentence item.
 * @param props.topicId - Topic the item belongs to; used for duplicate checks and distractor generation.
 * @param props.editing - Item being edited; null when creating a new item.
 * @param props.isPending - Disables submit while the parent mutation is in flight.
 * @param props.onSubmit - Called with validated form data; parent calls the create/update mutation.
 */
export function AddBuildSentenceItem({ topicId, editing, isPending, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BuildSentenceFormData>({
    resolver: zodResolver(buildSentenceSchema) as never,
    defaultValues,
  });

  const [debouncedSentence, setDebouncedSentence] = useState('');

  const {
    distractorInputs,
    setDistractorInputs,
    addDistractor,
    removeDistractor,
    clearDistractorInputs,
  } = useDistractors(watch, setValue);

  const { regenPrompt, setRegenPrompt, regeneratingPositions, handleRegenerate } =
    useDistractorRegen(topicId, getValues, setValue);

  useEffect(() => {
    if (editing) {
      const sentence = editing.words
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((w) => w.wordHr)
        .join(' ');
      reset({
        sentenceHr: sentence,
        translationRu: editing.translationRu,
        translationUk: editing.translationUk,
        translationEn: editing.translationEn,
        sortOrder: editing.sortOrder,
        words: editing.words.map((w) => ({
          wordHr: w.wordHr,
          position: w.position,
          distractors: [...w.distractors],
        })),
      });
    } else {
      reset(defaultValues);
      clearDistractorInputs();
    }
  }, [editing, reset, clearDistractorInputs]);

  const sentenceHr = watch('sentenceHr');
  const words = useWatch({ control, name: 'words', defaultValue: [] });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSentence(sentenceHr), 1000);
    return () => clearTimeout(id);
  }, [sentenceHr]);

  const { isLlmLoading, skipLlmRef } = useLlmTranslation({
    debouncedSentence,
    editing,
    setValue,
    clearDistractorInputs,
    handleRegenerate,
  });

  const { isCheckingDuplicate, handleSentenceBlur, handleGenerate } = useSentenceActions({
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
  });

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <LLMPromptSection topicId={topicId} onGenerate={handleGenerate} />
      <Box
        component="form"
        onSubmit={handleSubmit(async (data) => {
          try {
            await onSubmit(data);
            reset(defaultValues);
            clearDistractorInputs();
          } catch {
            // error shown via isPending/isError in parent
          }
        })}
      >
        <SentenceFields
          register={register}
          watch={watch}
          errors={errors}
          onSentenceBlur={handleSentenceBlur}
          isCheckingDuplicate={isCheckingDuplicate}
          isLlmLoading={isLlmLoading}
        />

        <WordSlotsSection
          words={words}
          errors={errors}
          regenPrompt={regenPrompt}
          onRegenPromptChange={setRegenPrompt}
          distractorInputs={distractorInputs}
          onDistractorInputChange={(pos, v) =>
            setDistractorInputs((prev) => ({ ...prev, [pos]: v }))
          }
          onAddDistractor={addDistractor}
          onRemoveDistractor={removeDistractor}
          onRegenerate={handleRegenerate}
          regeneratingPositions={regeneratingPositions}
        />

        <Divider sx={{ mb: 1.5 }} />
        <Button type="submit" variant="contained" size="small" disabled={isPending}>
          {isPending ? <CircularProgress size={20} /> : editing ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Paper>
  );
}
