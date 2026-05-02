/**
 * @module BuildSentence/AddBuildSentenceItem
 * @description Add/edit form for Build Sentence items. Admin types the full Croatian sentence;
 * it auto-splits into word slots on blur. Each slot has a distractor chip input.
 * @usedBy BuildSentenceTab
 */
import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Divider, Paper, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { buildSentenceSchema, defaultValues } from './schema';
import type { BuildSentenceFormData, BuildSentenceItemData } from './schema';
import { SentenceFields } from './SentenceFields';
import { WordSlot } from './WordSlot';

export type { BuildSentenceFormData, BuildSentenceItemData };

interface Props {
  editing: BuildSentenceItemData | null;
  isPending: boolean;
  onSubmit: (data: BuildSentenceFormData) => void;
}

export function AddBuildSentenceItem({ editing, isPending, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BuildSentenceFormData>({
    resolver: zodResolver(buildSentenceSchema) as never,
    defaultValues,
  });

  const [distractorInputs, setDistractorInputs] = useState<Record<number, string>>({});

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
      setDistractorInputs({});
    }
  }, [editing, reset]);

  const sentenceHr = watch('sentenceHr');
  const words = watch('words');

  const handleSentenceBlur = () => {
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
  };

  const addDistractor = (position: number) => {
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
  };

  const removeDistractor = (position: number, distractor: string) => {
    setValue(
      'words',
      watch('words').map((w) =>
        w.position === position
          ? { ...w, distractors: w.distractors.filter((d) => d !== distractor) }
          : w,
      ),
      { shouldValidate: true },
    );
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <SentenceFields register={register} errors={errors} onSentenceBlur={handleSentenceBlur} />

        {words.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Distractors per word (need 5 for 6 options total; auto-padded at runtime if fewer)
            </Typography>
            <Stack spacing={1}>
              {words.map((word) => (
                <WordSlot
                  key={word.position}
                  wordHr={word.wordHr}
                  position={word.position}
                  distractors={word.distractors}
                  inputValue={distractorInputs[word.position] ?? ''}
                  onInputChange={(v) =>
                    setDistractorInputs((prev) => ({ ...prev, [word.position]: v }))
                  }
                  onAdd={() => addDistractor(word.position)}
                  onRemove={(d) => removeDistractor(word.position, d)}
                />
              ))}
            </Stack>
          </Box>
        )}

        {errors.words && (
          <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
            {typeof errors.words.message === 'string' ? errors.words.message : 'Words are required'}
          </Typography>
        )}

        <Divider sx={{ mb: 1.5 }} />
        <Button type="submit" variant="contained" size="small" disabled={isPending}>
          {isPending ? <CircularProgress size={20} /> : editing ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Paper>
  );
}
