import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { DumbbellIcon, PlusIcon, SearchIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { DictionaryWordSort } from '../../../api/dictionary.ts';

const SORT_OPTIONS: DictionaryWordSort[] = ['newest', 'oldest', 'word', 'collection', 'progress'];

interface DictionaryTopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Called when Enter is pressed in a non-empty search field. */
  onSearchEnter: () => void;
  onAddWord: () => void;
  onStartPractice: () => void;
  /** Disables the Practice button when the word list is empty. */
  practiceDisabled: boolean;
  hideLearned: boolean;
  onHideLearnedChange: (value: boolean) => void;
  sort: DictionaryWordSort;
  onSortChange: (value: DictionaryWordSort) => void;
}

export function DictionaryTopBar({
  search,
  onSearchChange,
  onSearchEnter,
  onAddWord,
  onStartPractice,
  practiceDisabled,
  hideLearned,
  onHideLearnedChange,
  sort,
  onSortChange,
}: DictionaryTopBarProps) {
  const { t } = useTranslation();
  const hideLearnedId = useId();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Select value={sort} onValueChange={(value) => onSortChange(value as DictionaryWordSort)}>
        <SelectTrigger className="h-9 min-w-45" aria-label={t('dictionary.sortBy')}>
          <SelectValue>{(value: DictionaryWordSort) => t(`dictionary.sort.${value}`)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`dictionary.sort.${option}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative min-w-50 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-9 pl-8"
          placeholder={t('dictionary.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && search.trim()) onSearchEnter();
          }}
        />
      </div>

      <Button className="h-9" onClick={onAddWord}>
        <PlusIcon data-icon="inline-start" />
        {t('dictionary.addWord')}
      </Button>

      <Button
        variant="outline"
        className="h-9"
        onClick={onStartPractice}
        disabled={practiceDisabled}
      >
        <DumbbellIcon data-icon="inline-start" />
        {t('dictionary.practice.start')}
      </Button>

      <div className="flex items-center gap-2">
        <Checkbox
          id={hideLearnedId}
          checked={hideLearned}
          onCheckedChange={(checked) => onHideLearnedChange(checked === true)}
        />
        <Label htmlFor={hideLearnedId} className="text-sm font-normal">
          {t('dictionary.hideLearned')}
        </Label>
      </div>
    </div>
  );
}
