import { Button, CircularProgress } from '@mui/material';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';

interface CsvFilePickerProps {
  hasFile: boolean;
  isReading: boolean;
  disabled: boolean;
  onFile: (file: File) => void;
}

/**
 * Button wrapping a hidden file input. Prominent before a file is chosen, subtle afterwards.
 * The input is cleared after each pick so choosing the same file again still fires.
 */
export function CsvFilePicker({ hasFile, isReading, disabled, onFile }: CsvFilePickerProps) {
  return (
    <Button
      component="label"
      variant={hasFile ? 'text' : 'contained'}
      startIcon={isReading ? <CircularProgress size={16} /> : <UploadFileIcon />}
      disabled={isReading || disabled}
    >
      {hasFile ? 'Choose another file' : 'Choose CSV file'}
      <input
        hidden
        type="file"
        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
        data-testid="csv-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </Button>
  );
}
