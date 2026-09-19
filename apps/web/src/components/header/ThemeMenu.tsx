import { useTranslation } from 'react-i18next';
import { MoonIcon, SunIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { THEME_OPTIONS } from '@/components/ThemeToggleGroup';
import { useResolvedTheme } from '@/shared/hooks/useResolvedTheme';
import { useThemeSetting } from '@/shared/hooks/useThemeSetting';
import { isTheme } from '@/store/preferences.slice';

/** Radio items for the theme; shared by the guest `ThemeMenu` and the `UserMenu` submenu. */
export function ThemeRadioItems() {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeSetting();

  return (
    <DropdownMenuRadioGroup
      value={theme}
      onValueChange={(value) => {
        if (isTheme(value) && value !== theme) setTheme(value);
      }}
    >
      {THEME_OPTIONS.map(({ value, labelKey, Icon }) => (
        <DropdownMenuRadioItem key={value} value={value}>
          <Icon />
          {t(labelKey)}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

/** Icon-button theme switcher shown to guests, next to `LanguageMenu`. */
export function ThemeMenu() {
  const { t } = useTranslation();
  const resolved = useResolvedTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={t('header.theme')} />}
      >
        {resolved === 'dark' ? <MoonIcon /> : <SunIcon />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ThemeRadioItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
