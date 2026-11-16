/**
 * @module ImportPreview
 * @description Review step of the CSV import: file name and status counts, the "only rows with
 * issues" filter, bulk removal of error rows, and the editable table. Owns the filter, which is a
 * snapshot of row ids taken when it is switched on, so a row stays visible while it is being fixed.
 * @usedBy ImportWordsDialog
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Box, Button, Chip, FormControlLabel, Stack, Switch, Typography } from '@mui/material';

import type { ImportField, ImportRow, ImportValidation } from './csvImport';
import { ImportPreviewTable } from './ImportPreviewTable';

interface ImportPreviewProps {
  rows: ImportRow[];
  validation: ImportValidation;
  fileName: string;
  fileAction: ReactNode;
  disabled: boolean;
  onChange: (id: number, field: ImportField, value: string) => void;
  onRemove: (id: number) => void;
  onRemoveErrors: () => void;
}

/**
 * Renders the summary, filter controls and editable table for the parsed rows.
 * @param props.fileAction - Slot next to the file name, used for the "Choose another file" picker
 * @param props.disabled - Locks editing and controls while the import is running
 */
export function ImportPreview({
  rows,
  validation,
  fileName,
  fileAction,
  disabled,
  onChange,
  onRemove,
  onRemoveErrors,
}: ImportPreviewProps) {
  const [issueIds, setIssueIds] = useState<Set<number> | null>(null);
  const { okCount, skipCount, errorCount } = validation;

  const visibleRows = useMemo(
    () => (issueIds ? rows.filter((row) => issueIds.has(row.id)) : rows),
    [rows, issueIds],
  );

  const toggleIssueFilter = (checked: boolean) => {
    setIssueIds(
      checked
        ? new Set(
            rows.filter((row) => validation.byId.get(row.id)?.status !== 'ok').map((row) => row.id),
          )
        : null,
    );
  };

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="subtitle2" sx={{ mr: 1 }}>
          {fileName}
        </Typography>
        <Chip label={`${rows.length} rows`} size="small" />
        <Chip label={`${okCount} ready`} size="small" color="success" />
        {skipCount > 0 && (
          <Chip label={`${skipCount} will be skipped`} size="small" color="warning" />
        )}
        {errorCount > 0 && <Chip label={`${errorCount} with errors`} size="small" color="error" />}
        <Box sx={{ flexGrow: 1 }} />
        {fileAction}
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <FormControlLabel
          label="Show only rows with issues"
          control={
            <Switch
              checked={issueIds !== null}
              onChange={(e) => toggleIssueFilter(e.target.checked)}
              disabled={disabled || (issueIds === null && skipCount + errorCount === 0)}
            />
          }
        />
        {errorCount > 0 && (
          <Button size="small" color="error" onClick={onRemoveErrors} disabled={disabled}>
            Remove rows with errors
          </Button>
        )}
      </Stack>

      <ImportPreviewTable
        key={issueIds ? 'issues' : 'all'}
        rows={visibleRows}
        validation={validation.byId}
        onChange={onChange}
        onRemove={onRemove}
        disabled={disabled}
      />
    </>
  );
}
