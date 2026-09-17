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

export function DictionaryMenu() {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" />}>
        {t('nav.dictionary')}
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem render={<Link to="/dictionary/my" />}>
          {t('nav.myDictionary')}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/dictionary/my-collections" />}>
          {t('nav.collections')}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/dictionary/recommended-word-sets" />}>
          {t('nav.wordSets')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
