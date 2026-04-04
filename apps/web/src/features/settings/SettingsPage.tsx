import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from '@mui/material';

import i18n from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store';
import { setUser } from '../../store/auth.slice';
import { apiClient } from '../../api/client';

const languages = [
  { code: 'RU', label: 'Русский' },
  { code: 'UK', label: 'Українська' },
  { code: 'EN', label: 'English' },
] as const;

export function SettingsPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleLanguageChange = async (_: React.MouseEvent, value: string | null) => {
    if (!value || value === user?.nativeLanguage) return;

    setSaving(true);
    setError('');
    try {
      const { data } = await apiClient.patch('/users/me', { nativeLanguage: value });
      dispatch(setUser(data));
      i18n.changeLanguage(value.toLowerCase());
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('settings.nativeLanguage')}
        </Typography>

        <ToggleButtonGroup
          value={user?.nativeLanguage ?? ''}
          exclusive
          onChange={handleLanguageChange}
          disabled={saving}
          fullWidth
        >
          {languages.map((lang) => (
            <ToggleButton key={lang.code} value={lang.code}>
              {lang.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}
