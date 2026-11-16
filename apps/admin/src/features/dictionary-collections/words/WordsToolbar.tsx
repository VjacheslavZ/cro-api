/**
 * @module WordsToolbar
 * @description Action row above the collection word list: the "Add Word" toggle (form state stays
 * in the parent) and the "Import CSV" button, which owns the open state of ImportWordsDialog.
 * @usedBy CollectionWordsPage
 */
import { useState } from 'react';
import { Button, Stack } from '@mui/material';
import { Add as AddIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';

import { ImportWordsDialog } from './csv-import/ImportWordsDialog';

interface WordsToolbarProps {
  collectionId: string | undefined;
  existingWords: readonly string[];
  isFormOpen: boolean;
  onToggleForm: () => void;
}

/**
 * Renders the word list actions and the CSV import dialog.
 * @param props.collectionId - Collection the import targets; the dialog is not rendered without it
 * @param props.existingWords - wordHr values already in the collection, passed to the import preview
 * @param props.isFormOpen - Whether the parent's AddWordForm is shown; switches the label to "Cancel"
 * @param props.onToggleForm - Called when "Add Word" / "Cancel" is pressed
 */
export function WordsToolbar({
  collectionId,
  existingWords,
  isFormOpen,
  onToggleForm,
}: WordsToolbarProps) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button startIcon={<AddIcon />} variant="outlined" onClick={onToggleForm}>
          {isFormOpen ? 'Cancel' : 'Add Word'}
        </Button>
        <Button
          startIcon={<UploadFileIcon />}
          variant="outlined"
          onClick={() => setImportOpen(true)}
        >
          Import CSV
        </Button>
      </Stack>

      {collectionId && (
        <ImportWordsDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          collectionId={collectionId}
          existingWords={existingWords}
        />
      )}
    </>
  );
}
