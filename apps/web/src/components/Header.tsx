import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { Star, LocalFireDepartment } from '@mui/icons-material';

import { useAppSelector } from '../store';
import { LanguageMenu } from './header/LanguageMenu';
import { DictionaryMenu } from './header/DictionaryMenu';
import { ExercisesMenu } from './header/ExercisesMenu';
import { UserMenu } from './header/UserMenu';

export function Header() {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(user);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'white',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          component={RouterLink}
          to="/"
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#2563eb',
            textDecoration: 'none',
            '&:hover': { color: '#1d4ed8' },
            width: 212,
          }}
        >
          CroGrammar
        </Typography>

        {isAuthenticated && (
          <>
            <Box>
              <ExercisesMenu />
              <DictionaryMenu />
            </Box>
            {/* XP pill */}
            <Box display="flex">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.625,
                  bgcolor: '#fefce8',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  mx: 0.5,
                }}
              >
                <Star sx={{ fontSize: 16, color: '#f59e0b' }} />
                {user?.xpTotal ?? 0}
              </Box>

              {/* Streak pill */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.625,
                  bgcolor: '#fff7ed',
                  color: '#c2410c',
                  border: '1px solid #fed7aa',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  mx: 0.5,
                }}
              >
                <LocalFireDepartment sx={{ fontSize: 16, color: '#f97316' }} />
                {user?.currentStreak ?? 0}
              </Box>

              <UserMenu />
            </Box>
          </>
        )}
        {!isAuthenticated && <LanguageMenu />}
      </Toolbar>
    </AppBar>
  );
}
