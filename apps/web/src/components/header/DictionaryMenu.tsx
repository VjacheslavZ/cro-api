import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem } from '@mui/material';

export function DictionaryMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <Button
        color="inherit"
        onMouseEnter={(e) => setAnchor(e.currentTarget)}
        onClick={() => navigate('/dictionary')}
        sx={{ color: 'text.primary' }}
      >
        {t('nav.dictionary')}
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { onMouseLeave: () => setAnchor(null) } }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            navigate('/dictionary/my');
          }}
        >
          {t('nav.myDictionary')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            navigate('/dictionary/my-collections');
          }}
        >
          {t('nav.collections')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            navigate('/dictionary/recommended-word-sets');
          }}
        >
          {t('nav.wordSets')}
        </MenuItem>
      </Menu>
    </>
  );
}
