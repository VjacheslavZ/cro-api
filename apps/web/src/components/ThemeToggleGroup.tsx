import { useTranslation } from 'react-i18next';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useThemeSetting } from '@/shared/hooks/useThemeSetting';
import { isTheme } from '@/store/preferences.slice';

export const THEME_OPTIONS = [
  { value: 'SYSTEM', labelKey: 'settings.theme.system', Icon: MonitorIcon },
  { value: 'LIGHT', labelKey: 'settings.theme.light', Icon: SunIcon },
  { value: 'DARK', labelKey: 'settings.theme.dark', Icon: MoonIcon },
] as const;

/** Three-way System / Light / Dark control, styled like the native-language picker in Settings. */
export function ThemeToggleGroup({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeSetting();

  return (
    <ToggleGroup
      variant="outline"
      spacing={0}
      className={className}
      aria-label={t('settings.theme.title')}
      value={[theme]}
      // Base UI hands back an array; clicking the active item yields `[]`, which we ignore.
      onValueChange={(val) => {
        const next = val[0];
        if (isTheme(next) && next !== theme) setTheme(next);
      }}
    >
      {THEME_OPTIONS.map(({ value, labelKey, Icon }) => (
        <ToggleGroupItem key={value} value={value}>
          <Icon />
          {t(labelKey)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
