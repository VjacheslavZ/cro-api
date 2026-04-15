import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? t('dictionary.collections.edit') : t('dictionary.collections.createCollection')}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label={t('dictionary.collections.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          autoFocus
        />
        <TextField
          fullWidth
          label={t('dictionary.collections.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={2}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dictionary.addWordModal.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!name.trim() || isPending}>
          {isEdit ? t('dictionary.collections.save') : t('dictionary.collections.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
