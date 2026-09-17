import { useState, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorAlert } from '@/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useCreateCollection, useUpdateCollection } from '../../api/dictionary';

/**
 * Modal dialog for creating or editing a personal dictionary collection.
 *
 * Used in: CollectionsPage — opened via "Create Collection" button (create
 * mode) or the edit icon on an existing collection card (edit mode).
 *
 * The mode is determined by the presence of `editData`: when provided the
 * dialog pre-fills the form and calls the update mutation on submit; otherwise
 * it creates a new collection.
 */
interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided the dialog operates in edit mode. */
  editData?: { id: string; name: string; description: string | null } | null;
}

export function CreateCollectionModal({ open, onClose, editData }: CreateCollectionModalProps) {
  const { t } = useTranslation();
  const id = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();

  const isEdit = !!editData;

  useEffect(() => {
    if (open) {
      setName(editData?.name ?? '');
      setDescription(editData?.description ?? '');
      setError('');
    }
  }, [open, editData]);

  const handleSubmit = async () => {
    setError('');
    try {
      if (isEdit && editData) {
        await updateCollection.mutateAsync({
          id: editData.id,
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
      } else {
        await createCollection.mutateAsync({
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
      }
      onClose();
    } catch {
      setError(t('common.error'));
    }
  };

  const isPending = createCollection.isPending || updateCollection.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('dictionary.collections.edit')
              : t('dictionary.collections.createCollection')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-name`}>{t('dictionary.collections.name')}</Label>
            <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-description`}>{t('dictionary.collections.description')}</Label>
            <Textarea
              id={`${id}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          {error && <ErrorAlert message={error} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('dictionary.addWordModal.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isEdit ? t('dictionary.collections.save') : t('dictionary.collections.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
