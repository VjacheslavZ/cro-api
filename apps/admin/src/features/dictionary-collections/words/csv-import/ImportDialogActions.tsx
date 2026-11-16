import { Button, CircularProgress, DialogActions, Typography } from '@mui/material';

import { formatWordCount } from './csvImport';

interface ImportDialogActionsProps {
  isDone: boolean;
  hasRows: boolean;
  okCount: number;
  errorCount: number;
  isImporting: boolean;
  onImport: () => void;
  onImportAnother: () => void;
  onClose: () => void;
}

/**
 * Dialog footer. After an import: "Import another file" / "Done". Before: Cancel and the import
 * button, which is disabled while rows have errors or nothing is ready.
 */
export function ImportDialogActions({
  isDone,
  hasRows,
  okCount,
  errorCount,
  isImporting,
  onImport,
  onImportAnother,
  onClose,
}: ImportDialogActionsProps) {
  if (isDone) {
    return (
      <DialogActions>
        <Button onClick={onImportAnother}>Import another file</Button>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    );
  }

  return (
    <DialogActions>
      {hasRows && errorCount > 0 && (
        <Typography variant="caption" color="error" sx={{ mr: 'auto', pl: 2 }}>
          Fix or remove rows with errors to continue.
        </Typography>
      )}
      <Button onClick={onClose} disabled={isImporting}>
        Cancel
      </Button>
      {hasRows && (
        <Button
          variant="contained"
          onClick={onImport}
          disabled={isImporting || errorCount > 0 || okCount === 0}
        >
          {isImporting ? <CircularProgress size={20} /> : `Import ${formatWordCount(okCount)}`}
        </Button>
      )}
    </DialogActions>
  );
}
