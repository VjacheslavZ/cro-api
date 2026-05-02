import { Box, Chip, IconButton, Stack, TextField, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface Props {
  wordHr: string;
  position: number;
  distractors: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (distractor: string) => void;
}

export function WordSlot({
  wordHr,
  position,
  distractors,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
}: Props) {
  return (
    <Box sx={{ p: 1.5, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        [{position + 1}] {wordHr}
        {distractors.length < 5 && (
          <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
            ({distractors.length}/5 distractors)
          </Typography>
        )}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
        {distractors.map((d) => (
          <Chip key={d} label={d} size="small" onDelete={() => onRemove(d)} />
        ))}
      </Box>

      <Stack direction="row" spacing={0.5}>
        <TextField
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Add distractor..."
          size="small"
          sx={{ width: 180 }}
        />
        <IconButton size="small" onClick={onAdd}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}
