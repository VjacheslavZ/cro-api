/**
 * @module useImportRows
 * @description Client-side state of a CSV import before anything is sent: reads and parses the
 * chosen file, holds the editable rows, and re-validates them against the collection's current
 * words on every change. `loadId` increases with every file so views can reset their own state.
 * @usedBy ImportWordsDialog
 */
import { useMemo, useState } from 'react';

import {
  decodeCsvBuffer,
  parseCsv,
  recordsToImportRows,
  validateImportRows,
  type ImportField,
  type ImportRow,
} from './csvImport';

/**
 * Owns the rows of the file being imported.
 * @param existingWords - wordHr values already in the collection; matching rows validate as `skip`
 * @returns Rows (null until a file is read), file info, validation and row editing actions
 */
export function useImportRows(existingWords: readonly string[]) {
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [loadId, setLoadId] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const existingSet = useMemo(() => new Set(existingWords), [existingWords]);
  const validation = useMemo(
    () => validateImportRows(rows ?? [], existingSet),
    [rows, existingSet],
  );

  const reset = () => {
    setRows(null);
    setFileName('');
    setFileError(null);
  };

  const loadFile = async (file: File) => {
    reset();
    setFileName(file.name);
    setLoadId((id) => id + 1);
    setIsReading(true);
    try {
      const parsed = recordsToImportRows(parseCsv(decodeCsvBuffer(await file.arrayBuffer())));
      if (parsed.length === 0) setFileError('No rows found in the file.');
      else setRows(parsed);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Could not read the file.');
    } finally {
      setIsReading(false);
    }
  };

  const updateRow = (id: number, field: ImportField, value: string) => {
    setRows(
      (prev) => prev?.map((row) => (row.id === id ? { ...row, [field]: value } : row)) ?? null,
    );
  };

  const removeRow = (id: number) => {
    setRows((prev) => prev?.filter((row) => row.id !== id) ?? null);
  };

  const removeErrorRows = () => {
    setRows(
      (prev) => prev?.filter((row) => validation.byId.get(row.id)?.status !== 'error') ?? null,
    );
  };

  return {
    rows,
    fileName,
    loadId,
    fileError,
    isReading,
    validation,
    loadFile,
    updateRow,
    removeRow,
    removeErrorRows,
    reset,
  };
}
