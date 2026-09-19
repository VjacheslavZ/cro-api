import type { ThemeValue } from '@/store/preferences.slice';

export type ResolvedTheme = 'light' | 'dark';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/** The OS-level dark-scheme media query, or `null` where `matchMedia` is unavailable (jsdom). */
export function getSystemMql(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(DARK_SCHEME_QUERY);
}

export function resolveTheme(theme: ThemeValue, systemDark: boolean): ResolvedTheme {
  if (theme === 'SYSTEM') return systemDark ? 'dark' : 'light';
  return theme === 'DARK' ? 'dark' : 'light';
}

/** Mirrors the pre-hydration script in `index.html`: the `dark` class drives every `dark:` utility. */
export function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}
