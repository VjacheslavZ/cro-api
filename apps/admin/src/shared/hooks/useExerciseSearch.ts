import { useMemo, useState } from 'react';

export function useExerciseSearch<T>(
  items: T[] | undefined,
  getSearchText: (item: T) => string[],
): { search: string; setSearch: (s: string) => void; filteredItems: T[] } {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !items) return items ?? [];
    return items.filter((item) =>
      getSearchText(item).some((text) => text.toLowerCase().includes(q)),
    );
  }, [items, search, getSearchText]);

  return { search, setSearch, filteredItems };
}
