import { Box, Button, Typography, Container, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '../../store';
import { setUser } from '../../store/auth.slice';
import { apiClient } from '../../api/client';
import i18n from '../../i18n';
// TODO move to const and reuse in other places SettingsPage.tsx
const languages = [
  { code: 'RU', label: 'Русский' },
  { code: 'UK', label: 'Українська' },
  { code: 'EN', label: 'English' },
] as const;

export function LanguageSelectPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSelect = async (nativeLanguage: string) => {
    try {
      const { data } = await apiClient.patch('/users/me', { nativeLanguage });
      dispatch(setUser(data));
      i18n.changeLanguage(nativeLanguage.toLowerCase());
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            {t('auth.selectLanguage')}
          </Typography>
          <Stack spacing={2} sx={{ mt: 3 }}>
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant="outlined"
                size="large"
                onClick={() => handleSelect(lang.code)}
                fullWidth
              >
                {lang.label}
              </Button>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
