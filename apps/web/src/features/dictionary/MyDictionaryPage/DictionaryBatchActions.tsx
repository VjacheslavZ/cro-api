import { useTranslation } from 'react-i18next';
import type { DictionaryCollection } from '@cro/shared';
import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DictionaryBatchActionsProps {
  selectedCount: number;
  assignCollectionId: string;
  collections: DictionaryCollection[];
  onAssignCollectionChange: (id: string) => void;
  onAssign: () => void;
  onCancel: () => void;
}

export function DictionaryBatchActions({
  selectedCount,
  assignCollectionId,
  collections,
  onAssignCollectionChange,
  onAssign,
  onCancel,
}: DictionaryBatchActionsProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-neutral-900 px-6 py-3 whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
      <span className="text-sm font-medium">
        {t('dictionary.selected', { count: selectedCount })}
      </span>

      <Select
        value={assignCollectionId}
        onValueChange={(value) => onAssignCollectionChange(value ?? '')}
      >
        <SelectTrigger
          className="h-8 min-w-40 border-white/30 text-white hover:border-white/60 **:data-[slot=select-value]:text-white [&_svg]:text-white"
          aria-label={t('dictionary.assignCollection')}
        >
          <SelectValue>
            {(value: string) =>
              value ? (
                (collections.find((c) => c.id === value)?.name ?? t('dictionary.unassign'))
              ) : (
                <span className="opacity-60">{t('dictionary.assignCollection')}</span>
              )
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t('dictionary.unassign')}</SelectItem>
          {collections.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="outline"
        onClick={onAssign}
        className="border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
      >
        {t('dictionary.assignCollection')}
      </Button>

      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onCancel}
        aria-label={t('common.cancel')}
        className="text-white/70 hover:bg-white/10 hover:text-white"
      >
        <XIcon />
      </Button>
    </div>
  );
}
