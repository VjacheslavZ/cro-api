import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Divider, Paper } from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { apiClient } from '../../../../api/client.ts';
import { buildSentenceSchema, defaultValues } from '../schema.ts';
import type { BuildSentenceFormData, BuildSentenceItemData } from '../schema.ts';
import { SentenceFields } from '../SentenceFields.tsx';
import { LLMPromptSection } from '../LLMPromptSection.tsx';
import type { GeneratedSentenceData } from '../LLMPromptSection.tsx';
import { useDistractors } from './useDistractors.ts';
import { useDistractorRegen } from './useDistractorRegen.ts';
import { WordSlotsSection } from './WordSlotsSection.tsx';

export type { BuildSentenceFormData, BuildSentenceItemData };

interface Props {
  topicId: string;
  editing: BuildSentenceItemData | null;
  isPending: boolean;
  onSubmit: (data: BuildSentenceFormData) => Promise<void>;
}

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

  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

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
  };

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
