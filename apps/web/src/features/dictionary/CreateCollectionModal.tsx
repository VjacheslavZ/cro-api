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

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
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
