import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { useTranslation } from 'react-i18next';
import { Box, TextField, Link } from '@mui/material';

import { authClient } from '../../lib/auth-client';

type AuthMode = 'login' | 'register';

interface EmailAuthFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function EmailAuthForm({ loading, setLoading, onSuccess, onError }: EmailAuthFormProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError('');
    try {
      if (mode === 'register') {
        const result = await authClient.signUp.email({ email, password, name });
        if (result.error) {
          onError(result.error.message || t('auth.registrationFailed'));
          return;
        }
      } else {
        const result = await authClient.signIn.email({ email, password });
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
    <>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {mode === 'register' && (
          <TextField
            label={t('auth.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
        )}
        <TextField
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          inputProps={{ minLength: 8 }}
          fullWidth
        />
        <LoadingButton type="submit" variant="contained" size="large" loading={loading} fullWidth>
          {mode === 'register' ? t('auth.register') : t('auth.login')}
        </LoadingButton>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            onError('');
          }}
        >
          {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
        </Link>
      </Box>
    </>
  );
}
