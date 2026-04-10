import { useTranslation } from 'react-i18next';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import type { DictionaryCollection } from '@cro/shared';

interface DictionaryBatchActionsProps {
  selectedCount: number;
  assignCollectionId: string;
  collections: DictionaryCollection[];
  onAssignCollectionChange: (id: string) => void;
  onAssign: () => void;
}

export function DictionaryBatchActions({
  selectedCount,
  assignCollectionId,
  collections,
  onAssignCollectionChange,
  onAssign,
}: DictionaryBatchActionsProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {t('dictionary.selected', { count: selectedCount })}
      </Typography>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>{t('dictionary.assignCollection')}</InputLabel>
        <Select
          value={assignCollectionId}
          onChange={(e) => onAssignCollectionChange(e.target.value)}
          label={t('dictionary.assignCollection')}
        >
          <MenuItem value="">{t('dictionary.unassign')}</MenuItem>
          {collections.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button size="small" variant="outlined" onClick={onAssign}>
        {t('dictionary.assignCollection')}
      </Button>
    </Box>
  );
}
