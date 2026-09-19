import { useSyncExternalStore } from 'react';

import { useAppSelector } from '@/store';
import { getSystemMql, resolveTheme, type ResolvedTheme } from '@/lib/theme';

function subscribeToSystemScheme(onChange: () => void) {
  const mql = getSystemMql();
  if (!mql) return () => {};
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSystemDark() {
  return getSystemMql()?.matches ?? false;
}

/** The theme actually on screen ('light' | 'dark'), with SYSTEM resolved against the OS and kept live. */
export function useResolvedTheme(): ResolvedTheme {
  const theme = useAppSelector((state) => state.preferences.theme);
  const systemDark = useSyncExternalStore(subscribeToSystemScheme, getSystemDark, () => false);

  return resolveTheme(theme, systemDark);
}
