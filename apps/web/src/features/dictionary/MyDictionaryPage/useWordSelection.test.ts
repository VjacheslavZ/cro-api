import { act, renderHook } from '@testing-library/react';
import type { DictionaryWord } from '@cro/shared';

import { useWordSelection } from './useWordSelection';

const word = (id: string) => ({ id }) as DictionaryWord;
const words = [word('a'), word('b'), word('c')];

describe('useWordSelection', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useWordSelection(words));
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.allSelected).toBe(false);
  });

  it('selects and deselects a single word', () => {
    const { result } = renderHook(() => useWordSelection(words));

    act(() => result.current.select('a', true));
    expect([...result.current.selectedIds]).toEqual(['a']);

    act(() => result.current.select('a', false));
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('toggleAll selects every word, then clears when all are selected', () => {
    const { result } = renderHook(() => useWordSelection(words));

    act(() => result.current.toggleAll());
    expect([...result.current.selectedIds]).toEqual(['a', 'b', 'c']);
    expect(result.current.allSelected).toBe(true);

    act(() => result.current.toggleAll());
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.allSelected).toBe(false);
  });

  it('allSelected is false for an empty word list', () => {
    const { result } = renderHook(() => useWordSelection([]));
    expect(result.current.allSelected).toBe(false);
  });

  it('remove drops one id and keeps the same Set when the id was not selected', () => {
    const { result } = renderHook(() => useWordSelection(words));

    act(() => result.current.toggleAll());
    act(() => result.current.remove('b'));
    expect([...result.current.selectedIds]).toEqual(['a', 'c']);

    const before = result.current.selectedIds;
    act(() => result.current.remove('zzz'));
    expect(result.current.selectedIds).toBe(before);
  });

  it('clear empties the selection', () => {
    const { result } = renderHook(() => useWordSelection(words));

    act(() => result.current.toggleAll());
    act(() => result.current.clear());
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('keeps select / remove / clear referentially stable across renders', () => {
    const { result, rerender } = renderHook(() => useWordSelection(words));
    const { select, remove, clear } = result.current;

    act(() => result.current.select('a', true));
    rerender();

    expect(result.current.select).toBe(select);
    expect(result.current.remove).toBe(remove);
    expect(result.current.clear).toBe(clear);
  });
});
