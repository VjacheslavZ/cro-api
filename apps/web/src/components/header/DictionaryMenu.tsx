import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DICTIONARY_NAV } from './navLinks';

export function DictionaryMenu() {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" />}>
        {t(DICTIONARY_NAV.titleKey)}
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {DICTIONARY_NAV.links.map(({ to, labelKey }) => (
          <DropdownMenuItem key={to} render={<Link to={to} />}>
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
