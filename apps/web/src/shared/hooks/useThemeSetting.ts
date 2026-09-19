import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { apiClient } from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser, type UserProfile } from '@/store/auth.slice';
import { setTheme as setLocalTheme, type ThemeValue } from '@/store/preferences.slice';

/**
 * Theme preference shared by every switcher. Applies the choice locally at once
 * and, for a signed-in user, persists it on the profile so it follows them across devices.
 */
export function useThemeSetting() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.preferences.theme);
  const isAuthenticated = useAppSelector((state) => state.auth.user != null);

  const setTheme = useCallback(
    async (next: ThemeValue) => {
      dispatch(setLocalTheme(next));
      if (!isAuthenticated) return;
      try {
        const { data } = await apiClient.patch<UserProfile>('/users/me', { theme: next });
        dispatch(setUser(data));
      } catch {
        toast.error(t('common.error'));
      }
    },
    [dispatch, isAuthenticated, t],
  );

  return { theme, setTheme };
}
