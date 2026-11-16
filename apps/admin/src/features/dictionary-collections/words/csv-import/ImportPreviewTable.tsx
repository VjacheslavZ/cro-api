/**
 * @module ImportPreviewTable
 * @description Editable, paginated preview of parsed CSV rows. Only the current page is rendered,
 * so files with many thousands of rows stay responsive. Every cell is a controlled TextField; the
 * status column shows the row's validation result (ready / skipped with reason / first error).
 * Page state is owned here and clamped when rows are removed or the parent filters them.
 * @usedBy ImportPreview
 */
import { useState } from 'react';
import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

import {
  IMPORT_FIELDS,
  IMPORT_FIELD_LABELS,
  type ImportField,
  type ImportRow,
  type RowValidation,
} from './csvImport';

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

const HEADER_ROW = (
  <TableRow>
    <TableCell sx={{ width: 56 }}>Line</TableCell>
    {IMPORT_FIELDS.map((field) => (
      <TableCell key={field}>{IMPORT_FIELD_LABELS[field]}</TableCell>
    ))}
    <TableCell sx={{ width: 180 }}>Status</TableCell>
    <TableCell sx={{ width: 48 }} />
  </TableRow>
);

interface RowActions {
  onChange: (id: number, field: ImportField, value: string) => void;
  onRemove: (id: number) => void;
  disabled: boolean;
}

interface ImportPreviewTableProps extends RowActions {
  rows: ImportRow[];
  validation: Map<number, RowValidation>;
}

function StatusChip({ result }: { result: RowValidation | undefined }) {
  if (!result || result.status === 'ok') {
    return <Chip label="Ready" color="success" size="small" variant="outlined" />;
  }
  return (
    <Chip
      label={result.message}
      color={result.status === 'error' ? 'error' : 'warning'}
      size="small"
      variant={result.status === 'error' ? 'filled' : 'outlined'}
    />
  );
}

interface FieldCellProps {
  row: ImportRow;
  field: ImportField;
  error: string | undefined;
  onChange: RowActions['onChange'];
  disabled: boolean;
}

function FieldCell({ row, field, error, onChange, disabled }: FieldCellProps) {
  return (
    <TableCell sx={{ py: 0.5 }}>
      <TextField
        value={row[field]}
        onChange={(e) => onChange(row.id, field, e.target.value)}
        size="small"
        variant="standard"
        fullWidth
        disabled={disabled}
        error={!!error}
        title={error}
        slotProps={{
          htmlInput: { 'aria-label': `Line ${row.line} ${IMPORT_FIELD_LABELS[field]}` },
        }}
      />
    </TableCell>
  );
}

interface PreviewRowProps extends RowActions {
  row: ImportRow;
  result: RowValidation | undefined;
}

function PreviewRow({ row, result, onChange, onRemove, disabled }: PreviewRowProps) {
  return (
    <TableRow hover>
      <TableCell sx={{ color: 'text.secondary' }}>{row.line}</TableCell>
      {IMPORT_FIELDS.map((field) => (
        <FieldCell
          key={field}
          row={row}
          field={field}
          error={result?.fieldErrors[field]}
          onChange={onChange}
          disabled={disabled}
        />
      ))}
      <TableCell>
        <StatusChip result={result} />
      </TableCell>
      <TableCell padding="none">
        <Tooltip title="Remove row">
          <span>
            <IconButton
              size="small"
              onClick={() => onRemove(row.id)}
              disabled={disabled}
              aria-label={`Remove line ${row.line}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

/**
 * Renders the rows passed in (already filtered by the parent) with inline editing.
 * @param props.rows - Rows to show, in file order
 * @param props.validation - Validation results keyed by row id
 * @param props.onChange - Called on every keystroke with the row id, field and new value
 * @param props.onRemove - Called with the row id when the delete button is pressed
 * @param props.disabled - Locks editing while the import is running
 */
export function ImportPreviewTable({
  rows,
  validation,
  onChange,
  onRemove,
  disabled,
}: ImportPreviewTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);

  const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const pageRows = rows.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  return (
    <>
      <TableContainer sx={{ maxHeight: '55vh' }}>
        <Table size="small" stickyHeader>
          <TableHead>{HEADER_ROW}</TableHead>
          <TableBody>
            {pageRows.map((row) => (
              <PreviewRow
                key={row.id}
                row={row}
                result={validation.get(row.id)}
                onChange={onChange}
                onRemove={onRemove}
                disabled={disabled}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={rows.length}
        page={currentPage}
        onPageChange={(_, next) => setPage(next)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      />
    </>
  );
}
