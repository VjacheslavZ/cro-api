/**
 * @module ImportWordsDialog
 * @description CSV import of predefined words into one collection: pick a file → review and edit
 * the rows → import in batches. This component only wires the pieces together: useImportRows
 * (file parsing, editable rows, validation), useWordsImport (batched upload, progress, result) and
 * the step components. Closing is blocked while an import is running; all state resets on close.
 * @usedBy WordsToolbar
 */
import { Alert, Box, Dialog, DialogContent, DialogTitle, Stack } from '@mui/material';

import { toImportPayload } from './csvImport';
import { CsvFilePicker } from './CsvFilePicker';
import { CsvFormatHint } from './CsvFormatHint';
import { ImportDialogActions } from './ImportDialogActions';
import { ImportPreview } from './ImportPreview';
import { ImportProgressBar } from './ImportProgressBar';
import { ImportResultAlert } from './ImportResultAlert';
import { useImportRows } from './useImportRows';
import { useWordsImport } from './useWordsImport';

interface ImportWordsDialogProps {
  open: boolean;
  onClose: () => void;
  collectionId: string;
  existingWords: readonly string[];
}

/**
 * Renders the import dialog.
 * @param props.open - Whether the dialog is shown
 * @param props.onClose - Called when the admin closes the dialog (blocked while importing)
 * @param props.collectionId - Collection the words are imported into
 * @param props.existingWords - wordHr values already in the collection, used to mark skipped rows
 */
export function ImportWordsDialog({
  open,
  onClose,
  collectionId,
  existingWords,
}: ImportWordsDialogProps) {
  const file = useImportRows(existingWords);
  const upload = useWordsImport(collectionId);
  const { rows, validation } = file;

  const reset = () => {
    file.reset();
    upload.reset();
  };

  const handleClose = () => {
    if (upload.isImporting) return;
    reset();
    onClose();
  };

  const handleFile = (picked: File) => {
    upload.reset();
    void file.loadFile(picked);
  };

  const startImport = () => {
    if (rows) upload.start(toImportPayload(rows, validation), validation.skipCount);
  };

  const filePicker = (
    <CsvFilePicker
      hasFile={rows !== null}
      isReading={file.isReading}
      disabled={upload.isImporting}
      onFile={handleFile}
    />
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle>Import words from CSV</DialogTitle>

      <DialogContent dividers>
        {upload.result ? (
          <ImportResultAlert result={upload.result} />
        ) : (
          <Stack spacing={2}>
            {!rows && (
              <Box>
                <CsvFormatHint />
                {filePicker}
              </Box>
            )}

            {file.fileError && <Alert severity="error">{file.fileError}</Alert>}
            {upload.errorMessage && <Alert severity="error">{upload.errorMessage}</Alert>}

            {rows && (
              <ImportPreview
                key={file.loadId}
                rows={rows}
                validation={validation}
                fileName={file.fileName}
                fileAction={filePicker}
                disabled={upload.isImporting}
                onChange={file.updateRow}
                onRemove={file.removeRow}
                onRemoveErrors={file.removeErrorRows}
              />
            )}

            {upload.isImporting && <ImportProgressBar progress={upload.progress} />}
          </Stack>
        )}
      </DialogContent>

      <ImportDialogActions
        isDone={upload.result !== null}
        hasRows={rows !== null}
        okCount={validation.okCount}
        errorCount={validation.errorCount}
        isImporting={upload.isImporting}
        onImport={startImport}
        onImportAnother={reset}
        onClose={handleClose}
      />
    </Dialog>
  );
}
