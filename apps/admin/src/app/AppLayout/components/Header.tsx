import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

import { useAuth } from '../../../features/auth/auth-context.tsx';

interface Props {
  mobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
}
export function Header({ setMobileOpen, mobileOpen }: Props) {
  const { admin } = useAuth();

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={() => setMobileOpen(!mobileOpen)}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          Croatian Grammar Admin
        </Typography>

        {admin && (
          <Typography variant="body2" color="inherit">
            {admin.email}
          </Typography>
        )}
      </Toolbar>
    </AppBar>
  );
}
