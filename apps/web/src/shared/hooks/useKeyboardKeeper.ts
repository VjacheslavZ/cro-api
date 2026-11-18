import { useEffect } from 'react';

import { armKeyboardKeeper } from '@/shared/lib/keyboard-keeper.ts';

/**
 * Lets text-input exercises on this page keep the mobile keyboard open between items
 * (see `keyboard-keeper.ts`). Pass `false` while the page shows an exercise without a
 * text input: a keyboard parked by the previous input is then closed.
 */
export function useKeyboardKeeper(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    return armKeyboardKeeper();
  }, [enabled]);
}
