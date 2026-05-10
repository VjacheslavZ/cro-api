import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Autorenew as AutorenewIcon } from '@mui/icons-material';

interface Props {
  wordHr: string;
  position: number;
  distractors: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function WordSlot({
  wordHr,
  position,
  distractors = [],
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  onRegenerate,
  isRegenerating,
}: Props) {
  if (typeof distractors !== 'object') {
    return null;
  }
  const valueCounts = distractors.reduce<Record<string, number>>((acc, d) => {
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = Object.values(valueCounts).some((c) => c > 1);

  return (
    <Box
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: hasDuplicates ? 'error.main' : 'rgba(0,0,0,0.12)',
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
          [{position + 1}] {wordHr}
          {distractors.length < 5 && (
            <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
              ({distractors.length}/5 distractors)
            </Typography>
          )}
          {hasDuplicates && (
            <Typography component="span" variant="caption" color="error.main" sx={{ ml: 1 }}>
              duplicates
            </Typography>
          )}
        </Typography>
        {onRegenerate && (
          <IconButton
            size="small"
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Regenerate distractors with LLM"
          >
            {isRegenerating ? <CircularProgress size={16} /> : <AutorenewIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
        {distractors?.map((d, idx) => (
          <Chip
            key={idx}
            label={d}
            size="small"
            onDelete={() => onRemove(idx)}
            sx={valueCounts[d] > 1 ? { bgcolor: '#ffebee', color: '#c62828' } : undefined}
          />
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
