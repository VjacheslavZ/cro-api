/**
 * @module useWordsImport
 * @description Sends import rows to POST /admin/dictionary-collections/:id/words/import in
 * sequential batches of IMPORT_BATCH_SIZE and tracks progress. A failed batch stops the run;
 * batches already sent stay saved, and the error message says how far it got. On success or
 * failure invalidates ['admin-collection-words', collectionId] and ['admin-dictionary-collections'].
 * @usedBy ImportWordsDialog
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../../api/client';
import { IMPORT_BATCH_SIZE, chunk, type ImportWordPayload } from './csvImport';

export interface ImportResult {
  created: number;
  skipped: number;
}

export interface ImportProgress {
  done: number;
  total: number;
}

interface ImportRequest {
  words: ImportWordPayload[];
  skippedInPreview: number;
}

function serverMessage(err: unknown): string {
  const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message.join('; ');
  return message ?? 'An error occurred';
}

/**
 * Batched import mutation for one collection.
 * On settle: invalidates ['admin-collection-words', collectionId] and ['admin-dictionary-collections'].
 * @param collectionId - Collection the words are imported into
 * @returns `start(words, skippedInPreview)`, progress, the final result or error message, and reset
 */
export function useWordsImport(collectionId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ImportProgress>({ done: 0, total: 0 });

  const mutation = useMutation({
    mutationFn: async ({ words, skippedInPreview }: ImportRequest) => {
      // Rows skipped in the preview count as skipped too. Fixed here because once the word list
      // refetches, the imported rows themselves validate as "already in collection".
      const result: ImportResult = { created: 0, skipped: skippedInPreview };
      let done = 0;
      setProgress({ done, total: words.length });
      for (const batch of chunk(words, IMPORT_BATCH_SIZE)) {
        const { data } = await apiClient.post<ImportResult>(
          `/admin/dictionary-collections/${collectionId}/words/import`,
          { words: batch },
        );
        result.created += data.created;
        result.skipped += data.skipped;
        done += batch.length;
        setProgress({ done, total: words.length });
      }
      return result;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collection-words', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['admin-dictionary-collections'] });
    },
  });

  const errorMessage = mutation.isError
    ? (progress.done > 0
        ? `Import stopped after ${progress.done} of ${progress.total} rows (those are saved — importing again skips them). `
        : '') + serverMessage(mutation.error)
    : null;

  return {
    start: (words: ImportWordPayload[], skippedInPreview: number) =>
      mutation.mutate({ words, skippedInPreview }),
    isImporting: mutation.isPending,
    progress,
    result: mutation.data ?? null,
    errorMessage,
    reset: () => {
      mutation.reset();
      setProgress({ done: 0, total: 0 });
    },
  };
}
