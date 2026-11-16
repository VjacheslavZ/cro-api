import { Alert } from '@mui/material';

import { formatWordCount } from './csvImport';
import type { ImportResult } from './useWordsImport';

/** Final summary of a finished import. */
export function ImportResultAlert({ result }: { result: ImportResult }) {
  return (
    <Alert severity="success">
      Imported {formatWordCount(result.created)}.
      {result.skipped > 0 &&
        ` Skipped ${result.skipped} (already in the collection or duplicated in the file).`}
    </Alert>
  );
}
