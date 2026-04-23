import { useTranslation } from 'react-i18next';
import { Box, Typography, Select, MenuItem, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { DictionaryCollection } from '@cro/shared';

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
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: '#111827',
        color: 'white',
        borderRadius: '999px',
        px: 3,
        py: 1.5,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        whiteSpace: 'nowrap',
      }}
    >
      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
        {t('dictionary.selected', { count: selectedCount })}
      </Typography>

      <Select
        value={assignCollectionId}
        onChange={(e) => onAssignCollectionChange(e.target.value)}
        size="small"
        displayEmpty
        sx={{
          color: 'white',
          minWidth: 160,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
          '& .MuiSvgIcon-root': { color: 'white' },
          fontSize: '0.875rem',
        }}
        renderValue={(value) => {
          if (!value)
            return <span style={{ opacity: 0.6 }}>{t('dictionary.assignCollection')}</span>;
          return collections.find((c) => c.id === value)?.name ?? t('dictionary.unassign');
        }}
      >
        <MenuItem value="">{t('dictionary.unassign')}</MenuItem>
        {collections.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </Select>

      <Button
        size="small"
        variant="outlined"
        onClick={onAssign}
        sx={{
          color: 'white',
          borderColor: 'rgba(255,255,255,0.4)',
          '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
        }}
      >
        {t('dictionary.assignCollection')}
      </Button>

      <IconButton
        size="small"
        onClick={onCancel}
        sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}
      >
        <Close sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}
