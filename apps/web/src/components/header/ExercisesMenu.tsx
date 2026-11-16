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

import { EXERCISES_NAV } from './navLinks';

export function ExercisesMenu() {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" />}>
        {t(EXERCISES_NAV.titleKey)}
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {EXERCISES_NAV.links.map(({ to, labelKey }) => (
          <DropdownMenuItem key={to} render={<Link to={to} />}>
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
