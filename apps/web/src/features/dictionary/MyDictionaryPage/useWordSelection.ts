import { useCallback, useState } from 'react';
import type { DictionaryWord } from '@cro/shared';

/**
 * Checkbox selection state for the word list.
 *
 * All callbacks are referentially stable so memoized `WordRow`s
 * don't re-render when the selection changes elsewhere.
 */
export function useWordSelection(words: DictionaryWord[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = words.length > 0 && selectedIds.size === words.length;

  const toggleAll = useCallback(() => {
    setSelectedIds(allSelected ? new Set() : new Set(words.map((w) => w.id)));
  }, [allSelected, words]);

  const select = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return { selectedIds, allSelected, toggleAll, select, remove, clear };
}
