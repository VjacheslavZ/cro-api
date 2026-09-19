import { useEffect } from 'react';

import { applyTheme } from '@/lib/theme';
import { useResolvedTheme } from '@/shared/hooks/useResolvedTheme';

/** Keeps the `dark` class on `<html>` in sync with the theme preference. Renders nothing. */
export function ThemeEffect() {
  const resolved = useResolvedTheme();

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  return null;
}
