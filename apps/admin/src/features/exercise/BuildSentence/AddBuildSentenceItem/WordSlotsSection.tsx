import { Box, Stack, TextField, Typography } from '@mui/material';
import type { FieldErrors } from 'react-hook-form';

import { WordSlot } from '../WordSlot.tsx';
import type { BuildSentenceFormData } from '../schema.ts';

interface Props {
  words: BuildSentenceFormData['words'];
  errors: FieldErrors<BuildSentenceFormData>;
  regenPrompt: string;
  onRegenPromptChange: (value: string) => void;
  distractorInputs: Record<number, string>;
  onDistractorInputChange: (position: number, value: string) => void;
  onAddDistractor: (position: number) => void;
  onRemoveDistractor: (position: number, index: number) => void;
  onRegenerate: (position: number, wordHr: string) => void;
  regeneratingPositions: Set<number>;
}

export function WordSlotsSection({
  words,
  errors,
  regenPrompt,
  onRegenPromptChange,
  distractorInputs,
  onDistractorInputChange,
  onAddDistractor,
  onRemoveDistractor,
  onRegenerate,
  regeneratingPositions,
}: Props) {
  if (words.length === 0) return null;
  console.log('words', words);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        Distractors per word (need 5 for 6 options total; auto-padded at runtime if fewer)
      </Typography>
      <TextField
        value={regenPrompt}
        onChange={(e) => onRegenPromptChange(e.target.value)}
        label="Regenerate prompt"
        multiline
        size="small"
        fullWidth
        sx={{ mb: 1 }}
        inputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
      />
      <Stack spacing={1}>
        {words.map((word) => (
          <WordSlot
            key={word.position}
            wordHr={word.wordHr}
            position={word.position}
            distractors={word.distractors}
            inputValue={distractorInputs[word.position] ?? ''}
            onInputChange={(v) => onDistractorInputChange(word.position, v)}
            onAdd={() => onAddDistractor(word.position)}
            onRemove={(idx) => onRemoveDistractor(word.position, idx)}
            onRegenerate={() => onRegenerate(word.position, word.wordHr)}
            isRegenerating={regeneratingPositions.has(word.position)}
          />
        ))}
      </Stack>
      {errors.words && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {typeof errors.words.message === 'string' ? errors.words.message : 'Words are required'}
        </Typography>
      )}
    </Box>
  );
}
