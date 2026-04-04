import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  Typography,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Settings, Logout } from '@mui/icons-material';

import { useAppSelector, useAppDispatch } from '../../store';
import { clearAuth } from '../../store/auth.slice';

export function UserMenu() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  if (!user) return null;

  const handleLogout = () => {
    setAnchor(null);
    dispatch(clearAuth());
    navigate('/login', { replace: true });
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ ml: 1 }}>
        <Avatar src={user.avatarUrl ?? undefined} alt={user.name}>
          {user.name.charAt(0)}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem disabled>
          <ListItemText primary={t('header.role')} secondary={user.role} />
        </MenuItem>
        <MenuItem disabled>
          <ListItemText primary={t('header.xp')} secondary={user.xpTotal} />
        </MenuItem>
        <MenuItem disabled>
          <ListItemText primary={t('header.streak')} secondary={user.currentStreak} />
        </MenuItem>
        {user.nativeLanguage && (
          <MenuItem disabled>
            <ListItemText primary={t('header.nativeLanguage')} secondary={user.nativeLanguage} />
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            navigate('/settings');
          }}
        >
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('header.settings')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('header.logout')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
