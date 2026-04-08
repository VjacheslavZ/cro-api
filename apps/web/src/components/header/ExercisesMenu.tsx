import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem } from '@mui/material';

export function ExercisesMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <Button
        color="inherit"
        onMouseEnter={(e) => setAnchor(e.currentTarget)}
        onClick={() => navigate('/exercises/grammar')}
      >
        {t('nav.exercises')}
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
            navigate('/exercises/grammar');
          }}
        >
          {t('nav.grammar')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            navigate('/exercises/vocabulary');
          }}
        >
          {t('nav.vocabulary')}
        </MenuItem>
      </Menu>
    </>
  );
}
