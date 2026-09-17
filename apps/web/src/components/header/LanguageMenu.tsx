import { useTranslation } from 'react-i18next';
import { CheckIcon, LanguagesIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const APP_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
] as const;

export function LanguageMenu() {
  const { i18n } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Language" />}>
        <LanguagesIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {APP_LANGUAGES.map((lang) => {
          const selected = i18n.language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              aria-current={selected ? 'true' : undefined}
              className="justify-between"
              onClick={() => i18n.changeLanguage(lang.code)}
            >
              {lang.label}
              {selected && <CheckIcon className="text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
