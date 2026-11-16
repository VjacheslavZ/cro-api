import { Typography } from '@mui/material';

import { IMPORT_FIELDS, IMPORT_FIELD_LABELS } from './csvImport';

const COLUMN_ORDER = IMPORT_FIELDS.map((field) => IMPORT_FIELD_LABELS[field]).join(', ');

/** Explains the expected CSV layout before a file is chosen. */
export function CsvFormatHint() {
  return (
    <Typography variant="body2" sx={{ mb: 1 }}>
      Columns, in this order: <b>{COLUMN_ORDER}</b>. A header row is optional. Comma, semicolon and
      tab delimiters are detected automatically; the file must be UTF-8.
    </Typography>
  );
}
