import { LoadingButton } from '@mui/lab';
import { useTranslation } from 'react-i18next';
import { Box, TextField } from '@mui/material';

import { authClient } from '../../lib/auth-client';

type AuthMode = 'login' | 'register';

interface EmailAuthFormProps {
  mode: AuthMode;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  formData: { name: string; email: string; password: string };
  setFormData: (data: { name: string; email: string; password: string }) => void;
}

export function EmailAuthForm({
  mode,
  loading,
  setLoading,
  onSuccess,
  onError,
  formData,
  setFormData,
}: EmailAuthFormProps) {
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError('');
    try {
      if (mode === 'register') {
        const result = await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        if (result.error) {
          onError(result.error.message || t('auth.registrationFailed'));
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
        });
        if (result.error) {
          onError(result.error.message || t('auth.loginFailed'));
          return;
        }
      }
      onSuccess();
    } catch {
      onError(mode === 'register' ? t('auth.registrationFailed') : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {mode === 'register' && (
        <TextField
          label={t('auth.name')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          fullWidth
          disabled={loading}
        />
      )}
      <TextField
        label={t('auth.email')}
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        fullWidth
        disabled={loading}
      />
      <TextField
        label={t('auth.password')}
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        inputProps={{ minLength: 8 }}
        fullWidth
        disabled={loading}
      />
      <LoadingButton type="submit" variant="contained" size="large" loading={loading} fullWidth>
        {mode === 'register' ? t('auth.register') : t('auth.login')}
      </LoadingButton>
    </Box>
  );
}
