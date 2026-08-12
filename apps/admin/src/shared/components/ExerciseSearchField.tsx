/**
 * @module ExerciseSearchField
 * @description Controlled search input with a leading search icon. Uses MUI slotProps
 * @usedBy FillInBlank, Flashcards, BuildSentence, TypeTheAnswer
 */
import { InputAdornment, TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Renders a fixed-width (340 px) search field with a leading search icon. */
export function ExerciseSearchField({ value, onChange, placeholder = 'Search…' }: Props) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ width: 340 }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
